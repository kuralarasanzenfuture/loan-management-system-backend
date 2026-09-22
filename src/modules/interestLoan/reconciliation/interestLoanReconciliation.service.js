import crypto from "crypto";
import dayjs from "dayjs";
import { getDB } from "../../../config/db.js";
import { FinancialMath } from "../../../utils/financialMath.js";

/**
 * ==============================================================================
 * InterestLoanReconciliationService
 * ==============================================================================
 * Independent Financial Audit & Reconciliation Engine
 *
 * Reconciles:
 * 1. Loan Master Totals vs Period Ledger Entries (total_interest_accrued == SUM(period.interest_amount))
 * 2. Loan Master Paid vs Period Ledger Paid (total_interest_paid == SUM(period.paid_interest_amount))
 * 3. Loan Master Paid vs Payment Ledger (total_interest_paid == SUM(payment.interest_amount))
 * 4. Principal Paid Integrity (total_principal_paid == SUM(payment.principal_amount))
 * 5. Outstanding Principal Balance (outstanding_principal == principal_amount - total_principal_paid)
 * 6. Outstanding Interest Balance (outstanding_interest == total_interest_accrued - total_interest_paid)
 * 7. Period Sequence Integrity (no gaps in period_no: 1, 2, 3...)
 * 8. Period Date Integrity (no duplicate scheduled dates per loan)
 *
 * Outputs:
 * - Persists audit summary in `reconciliation_reports`
 * - Persists detailed discrepancies in `reconciliation_discrepancies`
 * - Employs zero-drift decimal math (FinancialMath)
 */
export const InterestLoanReconciliationService = {
  /**
   * Run full reconciliation across loans
   * @param {Object} [options]
   * @param {number|null} [options.loanId] - Optional: reconcile single loan
   * @param {string|null} [options.targetDate] - Optional reconciliation date (defaults to today)
   * @returns {Promise<Object>} Reconciliation summary
   */
  async runReconciliation(options = {}) {
    const db = getDB();
    const reportUuid = crypto.randomUUID();
    const reconDate = options.targetDate
      ? dayjs(options.targetDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
    const startTime = new Date();
    const startMs = Date.now();

    console.log(
      `\n🔍 [Reconciliation] Starting financial reconciliation report: ${reportUuid} for ${reconDate}...`
    );

    // 1. Initialize Report in DB
    const [reportInsert] = await db.query(
      `INSERT INTO reconciliation_reports (
        report_uuid, reconciliation_date, start_time, status,
        total_loans_checked, total_periods_checked, discrepancy_count
      ) VALUES (?, ?, ?, 'clean', 0, 0, 0)`,
      [reportUuid, reconDate, startTime]
    );
    const reportId = reportInsert.insertId;

    try {
      // 2. Fetch Loans to Check
      let loanQuery = `SELECT id, loan_no, status, principal_amount, outstanding_principal, 
                              total_interest_accrued, total_interest_paid, total_principal_paid, 
                              outstanding_interest, next_interest_date
                       FROM interest_loans`;
      const queryParams = [];

      if (options.loanId) {
        loanQuery += " WHERE id = ?";
        queryParams.push(options.loanId);
      } else {
        // Exclude cancelled loans from reconciliation, check active, completed, closed
        loanQuery += " WHERE status IN ('active', 'completed', 'closed') ORDER BY id ASC";
      }

      const [loans] = await db.query(loanQuery, queryParams);

      let totalLoansChecked = 0;
      let totalPeriodsChecked = 0;
      const allDiscrepancies = [];

      for (const loan of loans) {
        totalLoansChecked++;
        const loanDiscrepancies = await this._reconcileSingleLoan(db, loan);
        if (loanDiscrepancies.periodsCount) {
          totalPeriodsChecked += loanDiscrepancies.periodsCount;
        }

        if (loanDiscrepancies.discrepancies.length > 0) {
          for (const d of loanDiscrepancies.discrepancies) {
            allDiscrepancies.push({
              report_id: reportId,
              loan_id: loan.id,
              ...d,
            });
          }
        }
      }

      // 3. Batch Insert Discrepancies if found
      if (allDiscrepancies.length > 0) {
        console.warn(
          `⚠️ [Reconciliation] Found ${allDiscrepancies.length} discrepancy(ies) across ${totalLoansChecked} loan(s)!`
        );

        for (const disc of allDiscrepancies) {
          await db.query(
            `INSERT INTO reconciliation_discrepancies (
              report_id, loan_id, discrepancy_type, severity,
              expected_value, actual_value, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              disc.report_id,
              disc.loan_id,
              disc.discrepancy_type,
              disc.severity,
              disc.expected_value,
              disc.actual_value,
              JSON.stringify(disc.details || {}),
            ]
          );
        }
      } else {
        console.log(
          `✅ [Reconciliation] Clean report: 0 discrepancies found across ${totalLoansChecked} loans.`
        );
      }

      // 4. Update Report Status & Final Metrics
      const durationMs = Date.now() - startMs;
      const finalStatus = allDiscrepancies.length > 0 ? "discrepancies_found" : "clean";
      const summary = {
        total_loans_checked: totalLoansChecked,
        total_periods_checked: totalPeriodsChecked,
        discrepancy_count: allDiscrepancies.length,
        duration_ms: durationMs,
        by_severity: {
          CRITICAL: allDiscrepancies.filter((d) => d.severity === "CRITICAL").length,
          HIGH: allDiscrepancies.filter((d) => d.severity === "HIGH").length,
          MEDIUM: allDiscrepancies.filter((d) => d.severity === "MEDIUM").length,
          LOW: allDiscrepancies.filter((d) => d.severity === "LOW").length,
        },
      };

      await db.query(
        `UPDATE reconciliation_reports
         SET end_time = NOW(),
             duration_ms = ?,
             status = ?,
             total_loans_checked = ?,
             total_periods_checked = ?,
             discrepancy_count = ?,
             summary = ?
         WHERE id = ?`,
        [
          durationMs,
          finalStatus,
          totalLoansChecked,
          totalPeriodsChecked,
          allDiscrepancies.length,
          JSON.stringify(summary),
          reportId,
        ]
      );

      return {
        report_id: reportId,
        report_uuid: reportUuid,
        reconciliation_date: reconDate,
        status: finalStatus,
        total_loans_checked: totalLoansChecked,
        total_periods_checked: totalPeriodsChecked,
        discrepancy_count: allDiscrepancies.length,
        summary,
      };
    } catch (error) {
      console.error("💥 [Reconciliation] Fatal error during reconciliation:", error.message);
      const durationMs = Date.now() - startMs;
      await db.query(
        `UPDATE reconciliation_reports
         SET end_time = NOW(),
             duration_ms = ?,
             status = 'failed',
             summary = ?
         WHERE id = ?`,
        [durationMs, JSON.stringify({ error: error.message }), reportId]
      );
      throw error;
    }
  },

  /**
   * Internal helper to reconcile a single loan against periods and payments
   */
  async _reconcileSingleLoan(db, loan) {
    const discrepancies = [];

    // A. Query period aggregates
    const [periodRows] = await db.query(
      `SELECT 
        COALESCE(SUM(interest_amount), 0) AS sum_interest_accrued,
        COALESCE(SUM(paid_interest_amount), 0) AS sum_interest_paid,
        COUNT(*) AS period_count
       FROM interest_loan_periods
       WHERE loan_id = ?`,
      [loan.id]
    );
    const periodData = periodRows[0];
    const periodsCount = parseInt(periodData?.period_count || 0, 10);
    const sumPeriodInterest = FinancialMath.toMoney(periodData?.sum_interest_accrued || 0);
    const sumPeriodPaid = FinancialMath.toMoney(periodData?.sum_interest_paid || 0);

    // B. Query payment aggregates
    const [paymentRows] = await db.query(
      `SELECT 
        COALESCE(SUM(interest_amount), 0) AS sum_payment_interest,
        COALESCE(SUM(principal_amount), 0) AS sum_payment_principal,
        COUNT(*) AS payment_count
       FROM interest_loan_payments
       WHERE loan_id = ?`,
      [loan.id]
    );
    const paymentData = paymentRows[0];
    const sumPaymentInterest = FinancialMath.toMoney(paymentData?.sum_payment_interest || 0);
    const sumPaymentPrincipal = FinancialMath.toMoney(paymentData?.sum_payment_principal || 0);

    // 1. Total Interest Accrued vs Period Sum
    const loanTotalAccrued = FinancialMath.toMoney(loan.total_interest_accrued);
    if (!FinancialMath.eq(loanTotalAccrued, sumPeriodInterest)) {
      discrepancies.push({
        discrepancy_type: "INTEREST_ACCRUAL_MISMATCH",
        severity: "CRITICAL",
        expected_value: loanTotalAccrued,
        actual_value: sumPeriodInterest,
        details: {
          loan_no: loan.loan_no,
          message: "Stored total_interest_accrued on loan does not match sum of period interest_amount.",
          difference: FinancialMath.sub(loanTotalAccrued, sumPeriodInterest),
        },
      });
    }

    // 2. Total Interest Paid vs Period Paid Sum
    const loanTotalInterestPaid = FinancialMath.toMoney(loan.total_interest_paid);
    if (!FinancialMath.eq(loanTotalInterestPaid, sumPeriodPaid)) {
      discrepancies.push({
        discrepancy_type: "PERIOD_INTEREST_PAID_MISMATCH",
        severity: "HIGH",
        expected_value: loanTotalInterestPaid,
        actual_value: sumPeriodPaid,
        details: {
          loan_no: loan.loan_no,
          message: "Stored total_interest_paid on loan does not match sum of period paid_interest_amount.",
          difference: FinancialMath.sub(loanTotalInterestPaid, sumPeriodPaid),
        },
      });
    }

    // 3. Total Interest Paid vs Payment Ledger Sum
    if (!FinancialMath.eq(loanTotalInterestPaid, sumPaymentInterest)) {
      discrepancies.push({
        discrepancy_type: "PAYMENT_INTEREST_PAID_MISMATCH",
        severity: "HIGH",
        expected_value: loanTotalInterestPaid,
        actual_value: sumPaymentInterest,
        details: {
          loan_no: loan.loan_no,
          message: "Stored total_interest_paid on loan does not match sum of payment interest_amount.",
          difference: FinancialMath.sub(loanTotalInterestPaid, sumPaymentInterest),
        },
      });
    }

    // 4. Principal Paid Integrity
    const loanTotalPrincipalPaid = FinancialMath.toMoney(loan.total_principal_paid);
    if (!FinancialMath.eq(loanTotalPrincipalPaid, sumPaymentPrincipal)) {
      discrepancies.push({
        discrepancy_type: "PRINCIPAL_PAID_MISMATCH",
        severity: "HIGH",
        expected_value: loanTotalPrincipalPaid,
        actual_value: sumPaymentPrincipal,
        details: {
          loan_no: loan.loan_no,
          message: "Stored total_principal_paid on loan does not match sum of payment principal_amount.",
          difference: FinancialMath.sub(loanTotalPrincipalPaid, sumPaymentPrincipal),
        },
      });
    }

    // 5. Outstanding Principal Balance Integrity:
    // Expected = principal_amount - total_principal_paid
    const loanPrincipal = FinancialMath.toMoney(loan.principal_amount);
    const expectedOutstandingPrincipal = FinancialMath.sub(loanPrincipal, loanTotalPrincipalPaid);
    const loanOutstandingPrincipal = FinancialMath.toMoney(loan.outstanding_principal);
    if (!FinancialMath.eq(loanOutstandingPrincipal, expectedOutstandingPrincipal)) {
      discrepancies.push({
        discrepancy_type: "OUTSTANDING_PRINCIPAL_MISMATCH",
        severity: "CRITICAL",
        expected_value: expectedOutstandingPrincipal,
        actual_value: loanOutstandingPrincipal,
        details: {
          loan_no: loan.loan_no,
          message: "Stored outstanding_principal does not match (principal_amount - total_principal_paid).",
          difference: FinancialMath.sub(loanOutstandingPrincipal, expectedOutstandingPrincipal),
        },
      });
    }

    // 6. Outstanding Interest Balance Integrity:
    // Expected = total_interest_accrued - total_interest_paid
    const expectedOutstandingInterest = FinancialMath.sub(loanTotalAccrued, loanTotalInterestPaid);
    const loanOutstandingInterest = FinancialMath.toMoney(loan.outstanding_interest);
    if (!FinancialMath.eq(loanOutstandingInterest, expectedOutstandingInterest)) {
      discrepancies.push({
        discrepancy_type: "OUTSTANDING_INTEREST_MISMATCH",
        severity: "CRITICAL",
        expected_value: expectedOutstandingInterest,
        actual_value: loanOutstandingInterest,
        details: {
          loan_no: loan.loan_no,
          message: "Stored outstanding_interest does not match (total_interest_accrued - total_interest_paid).",
          difference: FinancialMath.sub(loanOutstandingInterest, expectedOutstandingInterest),
        },
      });
    }

    // 7. Period Sequence & Scheduled Date Integrity
    if (periodsCount > 0) {
      const [periods] = await db.query(
        `SELECT period_no, scheduled_date 
         FROM interest_loan_periods 
         WHERE loan_id = ? 
         ORDER BY period_no ASC`,
        [loan.id]
      );

      const seenDates = new Set();
      let expectedPeriodNo = 1;

      for (const p of periods) {
        // Gap check
        if (p.period_no !== expectedPeriodNo) {
          discrepancies.push({
            discrepancy_type: "PERIOD_SEQUENCE_GAP",
            severity: "HIGH",
            expected_value: String(expectedPeriodNo),
            actual_value: String(p.period_no),
            details: {
              loan_no: loan.loan_no,
              message: `Sequence gap detected: expected period ${expectedPeriodNo} but found ${p.period_no}.`,
            },
          });
          expectedPeriodNo = p.period_no; // re-sync
        }
        expectedPeriodNo++;

        // Duplicate scheduled date check
        const dateStr = dayjs(p.scheduled_date).format("YYYY-MM-DD");
        if (seenDates.has(dateStr)) {
          discrepancies.push({
            discrepancy_type: "DUPLICATE_SCHEDULED_DATE",
            severity: "HIGH",
            expected_value: "UNIQUE_DATE",
            actual_value: dateStr,
            details: {
              loan_no: loan.loan_no,
              period_no: p.period_no,
              message: `Duplicate scheduled date ${dateStr} in period ledger.`,
            },
          });
        }
        seenDates.add(dateStr);
      }
    }

    return {
      periodsCount,
      discrepancies,
    };
  },

  /**
   * Retrieve paginated reconciliation reports
   */
  async getReports(limit = 20, offset = 0) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM reconciliation_reports 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );
    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM reconciliation_reports"
    );
    return {
      reports: rows,
      total: countRows[0]?.total || 0,
    };
  },

  /**
   * Retrieve discrepancies for a specific report
   */
  async getDiscrepanciesByReportId(reportId) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT d.*, l.loan_no 
       FROM reconciliation_discrepancies d
       JOIN interest_loans l ON l.id = d.loan_id
       WHERE d.report_id = ?
       ORDER BY d.id ASC`,
      [reportId]
    );
    return rows;
  },
};

export default InterestLoanReconciliationService;
