import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../../../config/db.js";
import { FinancialMath } from "../../../utils/financialMath.js";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const MAX_CATCH_UP_PERIODS = parseInt(
  process.env.INTEREST_LOAN_MAX_CATCHUP_PERIODS || "100",
  10
);
const MAX_TX_RETRIES = parseInt(
  process.env.INTEREST_LOAN_MAX_RETRIES || "3",
  10
);
const RETRY_BASE_DELAY_MS = parseInt(
  process.env.INTEREST_LOAN_RETRY_BASE_DELAY || "50",
  10
);

/**
 * Transient MySQL error codes eligible for retry
 */
const RETRYABLE_SQL_CODES = new Set([
  "ER_LOCK_DEADLOCK", // 1213
  "ER_LOCK_WAIT_TIMEOUT", // 1205
  "PROTOCOL_CONNECTION_LOST",
]);

/**
 * Execute a transactional operation with exponential backoff and jitter for transient errors.
 * Re-runs the entire transaction from scratch on deadlock.
 */
async function executeWithRetry(fn, maxRetries = MAX_TX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      attempt++;
      const isRetryable =
        RETRYABLE_SQL_CODES.has(err.code) ||
        (err.errno && (err.errno === 1213 || err.errno === 1205));

      if (isRetryable && attempt <= maxRetries) {
        // Exponential backoff with random jitter: base * 2^attempt + jitter
        const delay =
          RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 50;
        console.warn(
          `⚠️ [Deadlock/LockTimeout] Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms for code: ${err.code}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Compute cycle date anchored to the original inception start date without date drift.
 * Preserves exact end-of-month dates (e.g. Jan 31 -> Feb 28 -> Mar 31 -> Apr 30)
 * and leap years (Feb 29 -> Feb 28 -> Feb 28 -> Feb 28 -> Feb 29).
 */
export const computeCycleDate = (anchorStartDate, cycleNumber, frequency) => {
  const start = dayjs(anchorStartDate);
  const freq = (frequency || "monthly").toLowerCase();

  switch (freq) {
    case "daily":
      return start.add(cycleNumber, "day").format("YYYY-MM-DD");
    case "weekly":
      return start.add(cycleNumber, "week").format("YYYY-MM-DD");
    case "yearly": {
      const anchorDay = start.date();
      const targetYear = start.year() + cycleNumber;
      const targetMonth = start.month();
      const firstOfMonth = dayjs(
        `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-01`
      );
      const maxDays = firstOfMonth.daysInMonth();
      return firstOfMonth.date(Math.min(anchorDay, maxDays)).format("YYYY-MM-DD");
    }
    case "monthly":
    default: {
      const anchorDay = start.date();
      const targetMonth = start.add(cycleNumber, "month");
      const maxDays = targetMonth.daysInMonth();
      return targetMonth.date(Math.min(anchorDay, maxDays)).format("YYYY-MM-DD");
    }
  }
};

export const InterestLoanAccrualService = {
  computeCycleDate,

  /**
   * Helper to compute next period end date based on frequency (anchor-aware)
   */
  computeNextInterestDate(startDate, frequency, cycleNumber = 1) {
    return computeCycleDate(startDate, cycleNumber, frequency);
  },

  /**
   * Calculate interest amount using deterministic FinancialMath
   */
  calculateInterestAmount(principal, rate, type) {
    return FinancialMath.calculateInterest(principal, rate, type);
  },

  /**
   * GENERATE NEXT PERIOD FOR A LOAN (Manual API or Cron Engine)
   * Uses SELECT ... FOR UPDATE within isolated transaction.
   * Incremental aggregate update on loan + append-only financial audit log.
   */
  async generateNextPeriodForLoan(loanId, options = {}, externalConn = null) {
    const runOperation = async () => {
      const db = getDB();
      const conn = externalConn || (await db.getConnection());
      const shouldManageTx = !externalConn;

      try {
        if (shouldManageTx) await conn.beginTransaction();

        // 1. Lock loan record in consistent order
        const [loanRows] = await conn.query(
          `SELECT 
            l.*, 
            p.plan_name,
            p.plan_code,
            p.interest_type,
            p.interest_value,
            p.interest_frequency,
            p.calculation_method,
            p.principal_basis
          FROM interest_loans l
          INNER JOIN interest_loan_plans p ON l.interest_plan_id = p.id
          WHERE l.id = ? 
          FOR UPDATE`,
          [loanId]
        );

        if (!loanRows.length) {
          throw { status: 404, message: `Interest loan #${loanId} not found` };
        }

        const loan = loanRows[0];
        if (["completed", "closed", "cancelled"].includes(loan.status)) {
          throw {
            status: 400,
            message: `Cannot generate periods for a loan with status '${loan.status}'`,
          };
        }

        const targetDate = options.targetDate
          ? dayjs(options.targetDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");

        // 2. Query ONLY latest period with lock (bounded O(1) query)
        const [latestPeriods] = await conn.query(
          `SELECT * FROM interest_loan_periods 
           WHERE loan_id = ? 
           ORDER BY period_no DESC 
           LIMIT 1 
           FOR UPDATE`,
          [loan.id]
        );

        const latestPeriod = latestPeriods[0] || null;
        const nextPeriodNo = latestPeriod ? latestPeriod.period_no + 1 : 1;
        const periodStartDate = latestPeriod
          ? latestPeriod.scheduled_date
          : loan.start_date;

        const scheduledDate = computeCycleDate(
          loan.start_date,
          nextPeriodNo,
          loan.interest_frequency
        );
        const periodEndDate = scheduledDate;

        // 3. Check if scheduled date has arrived (unless forced)
        if (!options.force && dayjs(scheduledDate).isAfter(targetDate, "day")) {
          if (shouldManageTx) await conn.commit();
          return {
            already_exists: true,
            already_up_to_date: true,
            message: `No periods due for generation. Cycle #${nextPeriodNo} is scheduled for ${scheduledDate} (Target: ${targetDate}).`,
            loan_id: loan.id,
            loan_no: loan.loan_no,
            next_interest_date: scheduledDate,
          };
        }

        // 4. Duplicate Check against latest period
        if (
          latestPeriod &&
          (latestPeriod.period_no === nextPeriodNo ||
            latestPeriod.scheduled_date === scheduledDate)
        ) {
          if (shouldManageTx) await conn.commit();
          return {
            already_exists: true,
            message: `Period #${latestPeriod.period_no} for scheduled date ${scheduledDate} already exists`,
            period: latestPeriod,
            loan_id: loan.id,
            loan_no: loan.loan_no,
          };
        }

        // 5. Deterministic Decimal Interest Calculation
        const openingPrincipal =
          loan.principal_basis === "original_principal"
            ? FinancialMath.toMoney(loan.principal_amount)
            : FinancialMath.toMoney(loan.outstanding_principal);

        const interestAmount = FinancialMath.calculateInterest(
          openingPrincipal,
          loan.interest_rate,
          loan.interest_type
        );

        const isDue = dayjs(scheduledDate).isSameOrBefore(targetDate, "day");
        const periodStatus = isDue ? "due" : "pending";

        // 6. Insert new period with database unique constraint protection
        let newPeriodId;
        try {
          const [insertResult] = await conn.query(
            `INSERT INTO interest_loan_periods (
              loan_id,
              period_no,
              period_start_date,
              period_end_date,
              scheduled_date,
              opening_principal,
              interest_rate,
              interest_amount,
              paid_interest_amount,
              outstanding_interest_amount,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?)`,
            [
              loan.id,
              nextPeriodNo,
              periodStartDate,
              periodEndDate,
              scheduledDate,
              openingPrincipal,
              loan.interest_rate,
              interestAmount,
              interestAmount,
              periodStatus,
            ]
          );
          newPeriodId = insertResult.insertId;
        } catch (insertErr) {
          // Handle concurrent duplicate key safety (uq_interest_period / uq_interest_period_date)
          if (insertErr.code === "ER_DUP_ENTRY") {
            const [existing] = await conn.query(
              `SELECT * FROM interest_loan_periods WHERE loan_id = ? AND (period_no = ? OR scheduled_date = ?)`,
              [loan.id, nextPeriodNo, scheduledDate]
            );
            if (shouldManageTx) await conn.commit();
            return {
              already_exists: true,
              message: `Period #${nextPeriodNo} already exists (concurrent insert caught)`,
              period: existing[0] || null,
              loan_id: loan.id,
              loan_no: loan.loan_no,
            };
          }
          throw insertErr;
        }

        // 7. Atomic incremental delta calculation
        const beforeState = {
          loan_id: loan.id,
          loan_no: loan.loan_no,
          total_interest_accrued: FinancialMath.toMoney(loan.total_interest_accrued),
          outstanding_interest: FinancialMath.toMoney(loan.outstanding_interest),
          last_interest_date: loan.last_interest_date,
          next_interest_date: loan.next_interest_date,
        };

        const newTotalAccrued = FinancialMath.add(
          loan.total_interest_accrued,
          interestAmount
        );
        const newOutstandingInterest = FinancialMath.add(
          loan.outstanding_interest,
          interestAmount
        );

        // Advance next_interest_date using zero-drift anchor formula
        const upcomingNextInterestDate = computeCycleDate(
          loan.start_date,
          nextPeriodNo + 1,
          loan.interest_frequency
        );

        // 8. Update loan snapshot
        await conn.query(
          `UPDATE interest_loans 
           SET last_interest_date = ?,
               next_interest_date = ?,
               total_interest_accrued = ?,
               outstanding_interest = ?
           WHERE id = ?`,
          [
            scheduledDate,
            upcomingNextInterestDate,
            newTotalAccrued,
            newOutstandingInterest,
            loan.id,
          ]
        );

        const afterState = {
          loan_id: loan.id,
          loan_no: loan.loan_no,
          period_id: newPeriodId,
          period_no: nextPeriodNo,
          scheduled_date: scheduledDate,
          interest_amount: interestAmount,
          total_interest_accrued: newTotalAccrued,
          outstanding_interest: newOutstandingInterest,
          last_interest_date: scheduledDate,
          next_interest_date: upcomingNextInterestDate,
        };

        // 9. Append entry to financial_audit_logs inside the same transaction
        const auditId = uuidv4();
        await conn.query(
          `INSERT INTO financial_audit_logs (
            audit_id, entity_type, entity_id, loan_id, period_id,
            action, actor_type, actor_id, job_id, request_id,
            before_state, after_state
          ) VALUES (?, 'interest_loan_period', ?, ?, ?, 'ACCRUAL_GENERATED', ?, ?, ?, ?, ?, ?)`,
          [
            auditId,
            newPeriodId,
            loan.id,
            newPeriodId,
            options.actorType || "SYSTEM_CRON",
            options.actorId || null,
            options.jobId || null,
            options.requestId || null,
            JSON.stringify(beforeState),
            JSON.stringify(afterState),
          ]
        );

        if (shouldManageTx) await conn.commit();

        const createdPeriod = {
          id: newPeriodId,
          loan_id: loan.id,
          period_no: nextPeriodNo,
          period_start_date: periodStartDate,
          period_end_date: periodEndDate,
          scheduled_date: scheduledDate,
          opening_principal: openingPrincipal,
          interest_rate: loan.interest_rate,
          interest_amount: interestAmount,
          paid_interest_amount: "0.00",
          outstanding_interest_amount: interestAmount,
          status: periodStatus,
        };

        return {
          success: true,
          message: `Period #${nextPeriodNo} generated successfully`,
          period: createdPeriod,
          loan: {
            id: loan.id,
            loan_no: loan.loan_no,
            last_interest_date: scheduledDate,
            next_interest_date: upcomingNextInterestDate,
            total_interest_accrued: newTotalAccrued,
            outstanding_interest: newOutstandingInterest,
          },
        };
      } catch (err) {
        if (shouldManageTx) await conn.rollback();
        throw err;
      } finally {
        if (shouldManageTx) conn.release();
      }
    };

    return externalConn
      ? await runOperation()
      : await executeWithRetry(runOperation);
  },

  /**
   * Process accrual for a single loan with multi-period catch-up loop
   * Protected by MAX_CATCH_UP_PERIODS circuit breaker.
   */
  async processSingleLoanAccrual(loanId, targetDate = null, options = {}, externalConn = null) {
    const runOperation = async () => {
      const db = getDB();
      const conn = externalConn || (await db.getConnection());
      const shouldManageTx = !externalConn;

      try {
        if (shouldManageTx) await conn.beginTransaction();

        const today = targetDate
          ? dayjs(targetDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");

        const [loanRows] = await conn.query(
          `SELECT * FROM interest_loans WHERE id = ? FOR UPDATE`,
          [loanId]
        );

        if (!loanRows.length) {
          throw { status: 404, message: `Loan #${loanId} not found` };
        }

        const loan = loanRows[0];
        if (loan.status !== "active") {
          if (shouldManageTx) await conn.commit();
          return {
            loan_id: loan.id,
            loan_no: loan.loan_no,
            skipped: true,
            reason: `Loan is '${loan.status}', not 'active'`,
          };
        }

        if (!loan.next_interest_date || dayjs(loan.next_interest_date).isAfter(today, "day")) {
          if (shouldManageTx) await conn.commit();
          return {
            loan_id: loan.id,
            loan_no: loan.loan_no,
            skipped: true,
            reason: `next_interest_date (${loan.next_interest_date}) has not arrived yet (Target: ${today})`,
          };
        }

        // 1. Mark existing pending periods on or before today as due
        await conn.query(
          `UPDATE interest_loan_periods 
           SET status = 'due' 
           WHERE loan_id = ? AND status = 'pending' AND scheduled_date <= ?`,
          [loan.id, today]
        );

        // 2. Catch-up loop: generate overdue cycles until next_interest_date > today
        let periodsGenerated = 0;
        let currentNext = loan.next_interest_date;
        let iterationCount = 0;
        let circuitBreakerTripped = false;

        while (dayjs(currentNext).isSameOrBefore(today, "day")) {
          iterationCount++;

          // CIRCUIT BREAKER: Bounded catch-up guard
          if (iterationCount > MAX_CATCH_UP_PERIODS) {
            circuitBreakerTripped = true;
            console.error(
              `🚨 [CircuitBreaker] Loan ${loan.loan_no} exceeded MAX_CATCH_UP_PERIODS (${MAX_CATCH_UP_PERIODS}). Stopping catch-up loop to prevent runaway mutation.`
            );

            // Record alert in financial audit log
            await conn.query(
              `INSERT INTO financial_audit_logs (
                audit_id, entity_type, entity_id, loan_id,
                action, actor_type, job_id, after_state
              ) VALUES (?, 'interest_loan', ?, ?, 'RECOVERY_REQUIRED', 'SYSTEM_CRON', ?, ?)`,
              [
                uuidv4(),
                loan.id,
                loan.id,
                options.jobId || null,
                JSON.stringify({
                  error: "MAX_CATCH_UP_PERIODS_EXCEEDED",
                  loan_no: loan.loan_no,
                  threshold: MAX_CATCH_UP_PERIODS,
                  current_next: currentNext,
                  target_date: today,
                }),
              ]
            );
            break;
          }

          const genResult = await this.generateNextPeriodForLoan(
            loan.id,
            { targetDate: today, jobId: options.jobId, requestId: options.requestId },
            conn
          );

          if (genResult.already_exists) {
            // Period exists; advance cycle number using anchor formula
            const [periods] = await conn.query(
              `SELECT MAX(period_no) as max_no FROM interest_loan_periods WHERE loan_id = ?`,
              [loan.id]
            );
            const currentNo = (periods[0]?.max_no || 0) + 1;
            currentNext = computeCycleDate(
              loan.start_date,
              currentNo,
              loan.interest_frequency
            );
          } else {
            periodsGenerated++;
            currentNext = genResult.loan.next_interest_date;
          }
        }

        // 3. Fetch latest loan snapshot
        const [updatedLoan] = await conn.query(
          `SELECT * FROM interest_loans WHERE id = ?`,
          [loan.id]
        );

        if (shouldManageTx) await conn.commit();

        return {
          loan_id: loan.id,
          loan_no: loan.loan_no,
          periods_generated: periodsGenerated,
          circuit_breaker_tripped: circuitBreakerTripped,
          last_interest_date: updatedLoan[0].last_interest_date,
          next_interest_date: updatedLoan[0].next_interest_date,
          total_interest_accrued: updatedLoan[0].total_interest_accrued,
          outstanding_interest: updatedLoan[0].outstanding_interest,
        };
      } catch (err) {
        if (shouldManageTx) await conn.rollback();
        throw err;
      } finally {
        if (shouldManageTx) conn.release();
      }
    };

    return externalConn
      ? await runOperation()
      : await executeWithRetry(runOperation);
  },
};

export default InterestLoanAccrualService;
