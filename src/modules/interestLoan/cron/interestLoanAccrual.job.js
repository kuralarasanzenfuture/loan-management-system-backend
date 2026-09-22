import dayjs from "dayjs";
import os from "os";
import { getDB } from "../../../config/db.js";
import { InterestLoanAccrualService } from "./interestLoanAccrual.service.js";

const JOB_NAME = "interest_loan_daily_accrual";
const ENV = process.env.NODE_ENV || "production";
const LOCK_KEY = `interest_loan_accrual_cron_lock:${ENV}`;
const BATCH_SIZE = parseInt(process.env.INTEREST_LOAN_BATCH_SIZE || "50", 10);
const MAX_ERROR_LOG_ITEMS = 50; // Cap stored errors to prevent memory bloat

export const InterestLoanAccrualJob = {
  /**
   * Primary Job Execution Entry Point
   * - Environment-scoped MySQL advisory lock on a dedicated connection.
   * - Keyset streaming batches with bounded memory proportional to BATCH_SIZE.
   * - Periodic heartbeat updates.
   * - Audit logging in cron_job_logs.
   */
  async runDailyAccrualJob(targetDate = null, options = {}) {
    const db = getDB();
    const lockConn = await db.getConnection();
    const today = targetDate
      ? dayjs(targetDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    const startTime = Date.now();
    const hostname = os.hostname();
    const pid = process.pid;
    let logId = null;

    try {
      // 1. ACQUIRE ENVIRONMENT-SCOPED DISTRIBUTED ADVISORY LOCK
      // timeout = 0 returns immediately if another instance/worker holds the lock
      const [lockResult] = await lockConn.query(
        "SELECT GET_LOCK(?, 0) AS lock_acquired",
        [LOCK_KEY]
      );

      const hasLock = Boolean(lockResult[0]?.lock_acquired);
      if (!hasLock) {
        console.warn(
          `⚠️ [Interest Loan Job] Lock '${LOCK_KEY}' held by another worker. Skipping execution.`
        );
        return {
          skipped: true,
          reason: "LOCKED_BY_ANOTHER_INSTANCE",
          job_name: JOB_NAME,
          environment: ENV,
          execution_date: today,
        };
      }

      console.log(
        `\n🚀 [Interest Loan Job] Acquired lock '${LOCK_KEY}'. Starting accrual job for date: ${today} (PID: ${pid}, Host: ${hostname})...`
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

      // 3. INSERT AUDIT LOG ENTRY (status: 'RUNNING', with heartbeat)
      try {
        const [logInsert] = await db.query(
          `INSERT INTO cron_job_logs (
            job_name, environment, execution_date, start_time, heartbeat_at,
            hostname, pid, status, total_eligible
          ) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, 'RUNNING', ?)`,
          [JOB_NAME, ENV, today, hostname, pid, totalEligible]
        );
        logId = logInsert.insertId;
      } catch (logErr) {
        console.error(
          "⚠️ [Interest Loan Job] Failed to write initial cron_job_logs entry:",
          logErr.message
        );
      }

      console.log(
        `📊 [Interest Loan Job] Found ${totalEligible} eligible loan(s). Processing in keyset batches of ${BATCH_SIZE}...`
      );

      // 4. MEMORY-BOUNDED AGGREGATE COUNTERS
      let processedCount = 0;
      let periodsGenerated = 0;
      let failedCount = 0;
      let circuitBreakerTrips = 0;
      const errors = [];

      // 5. KEYSETTED BATCH LOOP (id > lastSeenId)
      let lastId = 0;
      let hasMore = true;
      let batchIndex = 0;

      while (hasMore) {
        batchIndex++;
        // Use keyset index (status, id, next_interest_date) to guarantee sequential scan without filesort
        const [batch] = await db.query(
          `SELECT id, loan_no, next_interest_date 
           FROM interest_loans FORCE INDEX (idx_interest_loan_keyset_v2)
           WHERE status = 'active' 
             AND id > ?
             AND next_interest_date IS NOT NULL 
             AND next_interest_date <= ? 
           ORDER BY id ASC 
           LIMIT ?`,
          [lastId, today, BATCH_SIZE]
        );

        if (!batch.length) {
          hasMore = false;
          break;
        }

        // Process loans sequentially in isolated transactions
        for (const item of batch) {
          try {
            const result = await InterestLoanAccrualService.processSingleLoanAccrual(
              item.id,
              today,
              { jobId: logId, requestId: options.requestId }
            );

            processedCount++;
            periodsGenerated += result.periods_generated || 0;
            if (result.circuit_breaker_tripped) {
              circuitBreakerTrips++;
            }
          } catch (loanErr) {
            failedCount++;
            if (errors.length < MAX_ERROR_LOG_ITEMS) {
              errors.push({
                loan_id: item.id,
                loan_no: item.loan_no,
                error: loanErr.message || String(loanErr),
              });
            }
            console.error(
              `  ❌ Loan ${item.loan_no} processing failure: ${loanErr.message}`
            );
          }
        }

        lastId = batch[batch.length - 1].id;
        if (batch.length < BATCH_SIZE) {
          hasMore = false;
        }

        // 6. UPDATE HEARTBEAT (Every batch)
        if (logId) {
          try {
            await db.query(
              `UPDATE cron_job_logs 
               SET heartbeat_at = NOW(),
                   processed_count = ?,
                   periods_generated = ?,
                   failed_count = ?
               WHERE id = ?`,
              [processedCount, periodsGenerated, failedCount, logId]
            );
          } catch (hbErr) {
            console.warn("Heartbeat update warning:", hbErr.message);
          }
        }
      }

      // 7. DETERMINE FINAL STATUS AND RECORD METRICS
      const durationMs = Date.now() - startTime;
      let finalStatus = "SUCCESS";
      if (failedCount > 0 && processedCount > 0) {
        finalStatus = "PARTIAL";
      } else if (failedCount > 0 && processedCount === 0) {
        finalStatus = "FAILED";
      }

      if (logId) {
        try {
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
              processedCount,
              periodsGenerated,
              failedCount,
              errors.length ? JSON.stringify(errors) : null,
              JSON.stringify({
                total_eligible: totalEligible,
                processed: processedCount,
                periods_generated: periodsGenerated,
                failed: failedCount,
                circuit_breaker_trips: circuitBreakerTrips,
                duration_ms: durationMs,
                batches: batchIndex,
              }),
              logId,
            ]
          );
        } catch (updateErr) {
          console.error(
            "⚠️ Failed to update final cron_job_logs entry:",
            updateErr.message
          );
        }
      }

      console.log(
        `✅ [Interest Loan Job] Execution completed in ${durationMs}ms: ${processedCount} processed, ${periodsGenerated} periods, ${failedCount} errors, ${circuitBreakerTrips} circuit breaker trips. Status: ${finalStatus}.\n`
      );

      return {
        job_id: logId,
        environment: ENV,
        execution_date: today,
        total_eligible: totalEligible,
        processed_count: processedCount,
        periods_generated: periodsGenerated,
        failed_count: failedCount,
        circuit_breaker_trips: circuitBreakerTrips,
        status: finalStatus,
        duration_ms: durationMs,
      };
    } catch (fatalErr) {
      const durationMs = Date.now() - startTime;
      console.error(
        `💥 [Interest Loan Job] Fatal exception in job execution:`,
        fatalErr.message
      );

      if (logId) {
        try {
          await db.query(
            `UPDATE cron_job_logs 
             SET end_time = NOW(),
                 duration_ms = ?,
                 status = 'FAILED',
                 error_details = ?
             WHERE id = ?`,
            [durationMs, JSON.stringify({ fatal: fatalErr.message }), logId]
          );
        } catch (err) {
          // ignore secondary logging failure
        }
      }

      throw fatalErr;
    } finally {
      // 8. ALWAYS RELEASE DISTRIBUTED ADVISORY LOCK
      try {
        await lockConn.query("SELECT RELEASE_LOCK(?)", [LOCK_KEY]);
      } catch (relErr) {
        console.error("Failed releasing distributed lock:", relErr.message);
      }
      lockConn.release();
    }
  },

  /**
   * Stale Job Watchdog: Detects and marks stuck jobs where heartbeat stopped updating
   */
  async detectAndMarkStaleJobs(staleThresholdMinutes = 15) {
    const db = getDB();
    const [result] = await db.query(
      `UPDATE cron_job_logs 
       SET status = 'STALE',
           error_details = JSON_OBJECT('reason', 'Heartbeat timeout. Process likely crashed or terminated.')
       WHERE job_name = ? 
         AND status = 'RUNNING' 
         AND heartbeat_at < NOW() - INTERVAL ? MINUTE`,
      [JOB_NAME, parseInt(staleThresholdMinutes, 10)]
    );
    return result.affectedRows;
  },

  /**
   * Health Check: Get latest execution log
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
   * Paginated audit logs for admin visibility
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
