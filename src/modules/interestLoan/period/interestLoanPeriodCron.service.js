import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { getDB } from "../../../config/db.js";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const round = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;

export const InterestLoanPeriodCronService = {
  /**
   * Helper to compute next period end date based on frequency
   */
  computeNextInterestDate(startDate, frequency) {
    const start = dayjs(startDate);
    switch (frequency?.toLowerCase()) {
      case "daily":
        return start.add(1, "day").format("YYYY-MM-DD");
      case "weekly":
        return start.add(1, "week").format("YYYY-MM-DD");
      case "yearly":
        return start.add(1, "year").format("YYYY-MM-DD");
      case "monthly":
      default:
        return start.add(1, "month").format("YYYY-MM-DD");
    }
  },

  /**
   * Helper to calculate period interest amount
   */
  calculateInterestAmount(principal, rate, type) {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    if (type === "percentage") {
      return round((p * r) / 100);
    }
    return round(r);
  },

  /**
   * GENERATE NEXT PERIOD FOR A LOAN (Manual API or Cron Engine)
   * 100% Idempotent: Never creates duplicate periods for the same cycle or scheduled date.
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

      // 3. Determine start date and scheduled date for the next period
      let nextPeriodNo = 1;
      let periodStartDate = loan.start_date;
      let periodEndDate = loan.next_interest_date;

      if (existingPeriods.length > 0) {
        const lastPeriod = existingPeriods[existingPeriods.length - 1];
        nextPeriodNo = lastPeriod.period_no + 1;
        periodStartDate = lastPeriod.period_end_date || lastPeriod.scheduled_date;
        periodEndDate = this.computeNextInterestDate(
          periodStartDate,
          loan.interest_frequency
        );
      } else {
        // First period ever: starts at loan start_date
        periodStartDate = loan.start_date;
        periodEndDate =
          loan.next_interest_date ||
          this.computeNextInterestDate(loan.start_date, loan.interest_frequency);
      }

      const scheduledDate = periodEndDate;

      // 4. DUE DATE & IDEMPOTENCY CHECK
      // For open-ended loans, periods are generated only when their due date has arrived (unless force: true)
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

      // Check if a period already exists for this scheduled date or period range
      const duplicatePeriod = existingPeriods.find(
        (p) =>
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

      // 5. Calculate principal and interest amount
      const openingPrincipal =
        loan.principal_basis === "original_principal"
          ? parseFloat(loan.principal_amount)
          : parseFloat(loan.outstanding_principal);

      const interestAmount = this.calculateInterestAmount(
        openingPrincipal,
        loan.interest_rate,
        loan.interest_type
      );

      // Status: 'due' if scheduled_date is reached or passed, else 'pending'
      const isDue = dayjs(scheduledDate).isSameOrBefore(targetDate, "day");
      const periodStatus = isDue ? "due" : "pending";

      // 6. Insert new period
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

      const newPeriodId = insertResult.insertId;

      // 7. Recalculate loan totals from all periods
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

      // Next interest date for the loan advances to the following cycle
      const upcomingNextInterestDate = this.computeNextInterestDate(
        scheduledDate,
        loan.interest_frequency
      );

      // 8. Update interest_loans table
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
   * Process accrual for a single loan (checks due dates and advances cycle)
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
        return {
          loan_id: loan.id,
          loan_no: loan.loan_no,
          skipped: true,
          reason: `Loan is '${loan.status}', not 'active'`,
        };
      }

      if (!loan.next_interest_date || dayjs(loan.next_interest_date).isAfter(today, "day")) {
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

      // 2. Generate period(s) while next_interest_date <= today
      let periodsGenerated = 0;
      let currentNext = loan.next_interest_date;

      while (dayjs(currentNext).isSameOrBefore(today, "day")) {
        const genResult = await this.generateNextPeriodForLoan(
          loan.id,
          { targetDate: today },
          conn
        );

        if (genResult.already_exists) {
          // If already exists, advance to next cycle date to prevent infinite loop
          currentNext = this.computeNextInterestDate(
            currentNext,
            loan.interest_frequency
          );
        } else {
          periodsGenerated++;
          currentNext = genResult.loan.next_interest_date;
        }
      }

      // Fetch updated loan snapshot
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

  /**
   * Primary cron execution job
   * Iterates through all active interest loans where next_interest_date <= targetDate
   */
  async processDailyInterestAccruals(targetDate = null) {
    const db = getDB();
    const today = targetDate
      ? dayjs(targetDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    console.log(`\n⏰ [Interest Loan Cron] Starting Daily Accrual Job for Date: ${today}...`);

    // Fetch eligible loans
    const [eligibleLoans] = await db.query(
      `SELECT id, loan_no, next_interest_date 
       FROM interest_loans 
       WHERE status = 'active' 
         AND next_interest_date IS NOT NULL 
         AND next_interest_date <= ? 
       ORDER BY id ASC`,
      [today]
    );

    console.log(
      `🔍 [Interest Loan Cron] Found ${eligibleLoans.length} active loan(s) due for interest processing.`
    );

    const summary = {
      execution_date: today,
      total_eligible: eligibleLoans.length,
      processed: 0,
      periods_generated: 0,
      successful_loans: [],
      errors: [],
    };

    if (eligibleLoans.length === 0) {
      console.log("✅ [Interest Loan Cron] No loans require accrual today.");
      return summary;
    }

    // Process each loan in isolated transaction
    for (const item of eligibleLoans) {
      try {
        const result = await this.processSingleLoanAccrual(item.id, today);
        summary.processed++;
        summary.periods_generated += result.periods_generated || 0;
        summary.successful_loans.push(result);

        console.log(
          `  ✓ Processed ${item.loan_no}: Generated ${result.periods_generated} new period(s), Next Date: ${result.next_interest_date}, Total Accrued: ₹${result.total_interest_accrued}`
        );
      } catch (error) {
        console.error(
          `  ❌ Failed processing ${item.loan_no}: ${error.message}`
        );
        summary.errors.push({
          loan_id: item.id,
          loan_no: item.loan_no,
          error: error.message,
        });
      }
    }

    console.log(
      `✅ [Interest Loan Cron] Finished: ${summary.processed}/${summary.total_eligible} processed, ${summary.periods_generated} period(s) created, ${summary.errors.length} error(s).\n`
    );

    return summary;
  },
};
