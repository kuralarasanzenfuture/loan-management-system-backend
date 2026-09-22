import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { getDB } from "../../../config/db.js";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const round = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;

/**
 * Compute cycle date anchored to the original start date without monthly date drift.
 * Correctly preserves end-of-month dates (e.g. Jan 31 -> Feb 28 -> Mar 31 -> Apr 30).
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
      const anchorMonth = start.month();
      const targetYear = start.year() + cycleNumber;
      const targetDate = dayjs().year(targetYear).month(anchorMonth);
      const maxDays = targetDate.daysInMonth();
      return targetDate.date(Math.min(anchorDay, maxDays)).format("YYYY-MM-DD");
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

/**
 * Calculate single period interest based on principal basis and interest type
 */
export const calculateInterestAmount = (principal, rate, type) => {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  if (type === "percentage") {
    return round((p * r) / 100);
  }
  return round(r);
};

export const InterestLoanAccrualService = {
  computeCycleDate,
  calculateInterestAmount,

  /**
   * Helper to compute next period end date based on frequency (anchor-aware)
   */
  computeNextInterestDate(startDate, frequency, cycleNumber = 1) {
    return computeCycleDate(startDate, cycleNumber, frequency);
  },

  /**
   * GENERATE NEXT PERIOD FOR A LOAN (Manual API or Cron Engine)
   * Fully Idempotent, uses SELECT ... FOR UPDATE within transaction.
   */
  async generateNextPeriodForLoan(loanId, options = {}, externalConn = null) {
    const db = getDB();
    const conn = externalConn || (await db.getConnection());
    const shouldManageTx = !externalConn;

    try {
      if (shouldManageTx) await conn.beginTransaction();

      // 1. Lock loan record
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

      // 2. Fetch all existing periods with lock
      const [existingPeriods] = await conn.query(
        `SELECT * FROM interest_loan_periods WHERE loan_id = ? ORDER BY period_no ASC FOR UPDATE`,
        [loan.id]
      );

      // 3. Determine period number and dates using zero-drift anchor math
      const nextPeriodNo =
        existingPeriods.length > 0
          ? existingPeriods[existingPeriods.length - 1].period_no + 1
          : 1;

      const periodStartDate =
        existingPeriods.length > 0
          ? existingPeriods[existingPeriods.length - 1].scheduled_date
          : loan.start_date;

      const scheduledDate = computeCycleDate(
        loan.start_date,
        nextPeriodNo,
        loan.interest_frequency
      );
      const periodEndDate = scheduledDate;

      // 4. Check if period is due (unless forced)
      if (!options.force && dayjs(scheduledDate).isAfter(targetDate, "day")) {
        if (shouldManageTx) await conn.commit();
        return {
          already_exists: true,
          already_up_to_date: true,
          message: `No periods due for generation. Next cycle #${nextPeriodNo} is scheduled for ${scheduledDate} and has not arrived yet (Target: ${targetDate}).`,
          loan_id: loan.id,
          loan_no: loan.loan_no,
          next_interest_date: scheduledDate,
        };
      }

      // 5. Duplicate Check
      const duplicatePeriod = existingPeriods.find(
        (p) =>
          p.period_no === nextPeriodNo ||
          p.scheduled_date === scheduledDate ||
          p.period_start_date === periodStartDate
      );

      if (duplicatePeriod) {
        if (shouldManageTx) await conn.commit();
        return {
          already_exists: true,
          message: `Period #${duplicatePeriod.period_no} for scheduled date ${scheduledDate} already exists`,
          period: duplicatePeriod,
          loan_id: loan.id,
          loan_no: loan.loan_no,
        };
      }

      // 6. Calculate principal and interest amount
      const openingPrincipal =
        loan.principal_basis === "original_principal"
          ? parseFloat(loan.principal_amount)
          : parseFloat(loan.outstanding_principal);

      const interestAmount = calculateInterestAmount(
        openingPrincipal,
        loan.interest_rate,
        loan.interest_type
      );

      const isDue = dayjs(scheduledDate).isSameOrBefore(targetDate, "day");
      const periodStatus = isDue ? "due" : "pending";

      // 7. Insert new period with duplicate protection
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loan.id,
            nextPeriodNo,
            periodStartDate,
            periodEndDate,
            scheduledDate,
            openingPrincipal,
            loan.interest_rate,
            interestAmount,
            0.0,
            interestAmount,
            periodStatus,
          ]
        );
        newPeriodId = insertResult.insertId;
      } catch (insertErr) {
        // Handle race-condition DB constraint violation safely
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

      // 8. Recalculate loan totals from all periods
      const [periodTotals] = await conn.query(
        `SELECT 
          COALESCE(SUM(interest_amount), 0.00) AS total_accrued,
          COALESCE(SUM(paid_interest_amount), 0.00) AS total_paid,
          COALESCE(SUM(outstanding_interest_amount), 0.00) AS total_outstanding
         FROM interest_loan_periods 
         WHERE loan_id = ?`,
        [loan.id]
      );

      const totalAccrued = round(periodTotals[0].total_accrued);
      const totalPaid = round(periodTotals[0].total_paid);
      const outstandingInterest = round(totalAccrued - totalPaid);

      // Advance next_interest_date using zero-drift anchor formula
      const upcomingNextInterestDate = computeCycleDate(
        loan.start_date,
        nextPeriodNo + 1,
        loan.interest_frequency
      );

      // 9. Update loan snapshot
      await conn.query(
        `UPDATE interest_loans 
         SET last_interest_date = ?,
             next_interest_date = ?,
             total_interest_accrued = ?,
             total_interest_paid = ?,
             outstanding_interest = ?
         WHERE id = ?`,
        [
          scheduledDate,
          upcomingNextInterestDate,
          totalAccrued,
          totalPaid,
          outstandingInterest,
          loan.id,
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
        paid_interest_amount: 0.0,
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
          total_interest_accrued: totalAccrued,
          outstanding_interest: outstandingInterest,
        },
      };
    } catch (err) {
      if (shouldManageTx) await conn.rollback();
      throw err;
    } finally {
      if (shouldManageTx) conn.release();
    }
  },

  /**
   * Process accrual for a single loan with multi-period catch-up loop
   */
  async processSingleLoanAccrual(loanId, targetDate = null, externalConn = null) {
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

      // 2. Catch-up loop: generate all overdue cycles until next_interest_date > today
      let periodsGenerated = 0;
      let currentNext = loan.next_interest_date;
      let iterationGuard = 0;
      const MAX_ITERATIONS = 365; // Prevent runaway loop in case of bad data

      while (
        dayjs(currentNext).isSameOrBefore(today, "day") &&
        iterationGuard < MAX_ITERATIONS
      ) {
        iterationGuard++;
        const genResult = await this.generateNextPeriodForLoan(
          loan.id,
          { targetDate: today },
          conn
        );

        if (genResult.already_exists) {
          // If period exists, advance date using anchor formula
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
        last_interest_date: updatedLoan[0].last_interest_date,
        next_interest_date: updatedLoan[0].next_interest_date,
        total_interest_accrued: parseFloat(updatedLoan[0].total_interest_accrued),
        outstanding_interest: parseFloat(updatedLoan[0].outstanding_interest),
      };
    } catch (err) {
      if (shouldManageTx) await conn.rollback();
      throw err;
    } finally {
      if (shouldManageTx) conn.release();
    }
  },
};

export default InterestLoanAccrualService;
