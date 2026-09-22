import dayjs from "dayjs";
import { getDB } from "../../../config/db.js";
import { InterestLoanAccrualService } from "./interestLoanAccrual.service.js";

const JOB_NAME = "interest_loan_daily_accrual";
const LOCK_KEY = "interest_loan_accrual_cron_lock";
const BATCH_SIZE = 50;

export const InterestLoanAccrualJob = {
  /**
   * Primary Job Execution Entry Point
   * Uses MySQL advisory distributed lock and keyset batch processing.
   */
  async runDailyAccrualJob(targetDate = null) {
    const db = getDB();
    const lockConn = await db.getConnection();
    const today = targetDate
      ? dayjs(targetDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    const startTime = Date.now();
    let logId = null;

    try {
      // 1. ACQUIRE DISTRIBUTED ADVISORY LOCK
      // timeout = 0 returns immediately if another instance holds the lock
      const [lockResult] = await lockConn.query(
        "SELECT GET_LOCK(?, 0) AS lock_acquired",
        [LOCK_KEY]
      );

      const hasLock = Boolean(lockResult[0]?.lock_acquired);
      if (!hasLock) {
        console.warn(
          `⚠️ [Interest Loan Job] Another instance is currently executing '${JOB_NAME}'. Skipping duplicate execution.`
        );
        return {
          skipped: true,
          reason: "LOCKED_BY_ANOTHER_INSTANCE",
          job_name: JOB_NAME,
          execution_date: today,
        };
      }

      console.log(
        `\n🚀 [Interest Loan Job] Distributed lock acquired. Starting accrual job for date: ${today}...`
      );

      // 2. COUNT TOTAL ELIGIBLE LOANS
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total 
         FROM interest_loans 
         WHERE status = 'active' 
           AND next_interest_date IS NOT NULL 
           AND next_interest_date <= ?`,
        [today]
      );
      const totalEligible = parseInt(countRows[0]?.total || 0, 10);

      // 3. INSERT AUDIT LOG (status: 'running')
      const [logInsert] = await db.query(
        `INSERT INTO cron_job_logs (
          job_name, execution_date, start_time, status, total_eligible
        ) VALUES (?, ?, NOW(), 'running', ?)`,
        [JOB_NAME, today, totalEligible]
      );
      logId = logInsert.insertId;

      console.log(
        `📊 [Interest Loan Job] Found ${totalEligible} eligible loan(s). Processing in batches of ${BATCH_SIZE}...`
      );

      const summary = {
        job_id: logId,
        execution_date: today,
        total_eligible: totalEligible,
        processed_count: 0,
        periods_generated: 0,
        failed_count: 0,
        successful_loans: [],
        errors: [],
      };

      // 4. KEYSETTED BATCH LOOP (id > lastSeenId)
      let lastId = 0;
      let hasMore = true;

      while (hasMore) {
        const [batch] = await db.query(
          `SELECT id, loan_no, next_interest_date 
           FROM interest_loans 
           WHERE status = 'active' 
             AND next_interest_date IS NOT NULL 
             AND next_interest_date <= ? 
             AND id > ?
           ORDER BY id ASC 
           LIMIT ?`,
          [today, lastId, BATCH_SIZE]
        );

        if (!batch.length) {
          hasMore = false;
          break;
        }

        for (const item of batch) {
          try {
            const result = await InterestLoanAccrualService.processSingleLoanAccrual(
              item.id,
              today
            );

            summary.processed_count++;
            summary.periods_generated += result.periods_generated || 0;
            summary.successful_loans.push({
              loan_id: result.loan_id,
              loan_no: result.loan_no,
              periods_generated: result.periods_generated,
              next_interest_date: result.next_interest_date,
            });

            console.log(
              `  ✓ Loan ${item.loan_no}: generated ${result.periods_generated || 0} period(s), next: ${result.next_interest_date}`
            );
          } catch (loanErr) {
            summary.failed_count++;
            summary.errors.push({
              loan_id: item.id,
              loan_no: item.loan_no,
              error: loanErr.message || String(loanErr),
            });
            console.error(
              `  ❌ Loan ${item.loan_no} error: ${loanErr.message}`
            );
          }
        }

        lastId = batch[batch.length - 1].id;
        if (batch.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      // 5. DETERMINE FINAL STATUS AND RECORD METRICS
      const durationMs = Date.now() - startTime;
      let finalStatus = "success";
      if (summary.failed_count > 0 && summary.processed_count > 0) {
        finalStatus = "partial";
      } else if (summary.failed_count > 0 && summary.processed_count === 0) {
        finalStatus = "failed";
      }

      await db.query(
        `UPDATE cron_job_logs 
         SET end_time = NOW(),
             duration_ms = ?,
             status = ?,
             processed_count = ?,
             periods_generated = ?,
             failed_count = ?,
             error_details = ?,
             summary = ?
         WHERE id = ?`,
        [
          durationMs,
          finalStatus,
          summary.processed_count,
          summary.periods_generated,
          summary.failed_count,
          summary.errors.length ? JSON.stringify(summary.errors) : null,
          JSON.stringify({
            total_eligible: summary.total_eligible,
            processed: summary.processed_count,
            periods: summary.periods_generated,
            duration_ms: durationMs,
          }),
          logId,
        ]
      );

      console.log(
        `✅ [Interest Loan Job] Completed in ${durationMs}ms: ${summary.processed_count} processed, ${summary.periods_generated} periods, ${summary.failed_count} errors. Status: ${finalStatus}.\n`
      );

      return {
        ...summary,
        status: finalStatus,
        duration_ms: durationMs,
      };
    } catch (fatalErr) {
      const durationMs = Date.now() - startTime;
      console.error(
        `💥 [Interest Loan Job] Fatal error during execution:`,
        fatalErr.message
      );

      if (logId) {
        await db.query(
          `UPDATE cron_job_logs 
           SET end_time = NOW(),
               duration_ms = ?,
               status = 'failed',
               error_details = ?
           WHERE id = ?`,
          [durationMs, JSON.stringify({ fatal: fatalErr.message }), logId]
        );
      }

      throw fatalErr;
    } finally {
      // 6. ALWAYS RELEASE DISTRIBUTED LOCK
      try {
        await lockConn.query("SELECT RELEASE_LOCK(?)", [LOCK_KEY]);
      } catch (relErr) {
        console.error("Failed releasing lock:", relErr.message);
      }
      lockConn.release();
    }
  },

  /**
   * Get latest execution record for health checks and monitoring
   */
  async getLatestExecution() {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM cron_job_logs 
       WHERE job_name = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [JOB_NAME]
    );
    return rows[0] || null;
  },

  /**
   * Get paginated logs for admin monitoring table
   */
  async getExecutionLogs(limit = 20, offset = 0) {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT * FROM cron_job_logs 
       WHERE job_name = ? 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [JOB_NAME, parseInt(limit, 10), parseInt(offset, 10)]
    );
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM cron_job_logs WHERE job_name = ?`,
      [JOB_NAME]
    );
    return {
      logs: rows,
      total: countRows[0]?.total || 0,
    };
  },
};

export default InterestLoanAccrualJob;
