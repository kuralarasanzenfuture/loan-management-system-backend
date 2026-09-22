import cron from "node-cron";
import { InterestLoanAccrualJob } from "./interestLoanAccrual.job.js";

let cronJobInstance = null;
let isCronRunningLocally = false;

/**
 * START DAILY ACCRUAL CRON SCHEDULER
 * Schedule: 12:05 AM every day ('5 0 * * *')
 * Default Timezone: Asia/Kolkata (+05:30)
 */
export const startInterestLoanCron = () => {
  const cronExpression = process.env.INTEREST_LOAN_CRON_SCHEDULE || "5 0 * * *";
  const timezone = process.env.TIMEZONE || "Asia/Kolkata";

  if (cronJobInstance) {
    console.log("ℹ️ [Interest Loan Scheduler] Cron job already initialized.");
    return cronJobInstance;
  }

  console.log(
    `⏳ [Interest Loan Scheduler] Registering daily interest accrual at '${cronExpression}' (${timezone})...`
  );

  cronJobInstance = cron.schedule(
    cronExpression,
    async () => {
      if (isCronRunningLocally) {
        console.warn(
          "⚠️ [Interest Loan Scheduler] Local thread is already executing a run. Skipping local overlap."
        );
        return;
      }

      isCronRunningLocally = true;
      try {
        console.log("⏰ [Interest Loan Scheduler] Scheduled cron trigger activated.");
        await InterestLoanAccrualJob.runDailyAccrualJob();
      } catch (error) {
        console.error(
          "❌ [Interest Loan Scheduler] Unhandled error during scheduled accrual:",
          error.message
        );
      } finally {
        isCronRunningLocally = false;
      }
    },
    {
      timezone,
    }
  );

  console.log("✅ [Interest Loan Scheduler] Daily interest accrual scheduler active.");
  return cronJobInstance;
};

/**
 * STOP CRON SCHEDULER
 */
export const stopInterestLoanCron = () => {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance = null;
    console.log("🛑 [Interest Loan Scheduler] Accrual scheduler stopped.");
  }
};

/**
 * MANUAL EXECUTION TRIGGER
 * Used by admin endpoint, testing scripts, or recovery workflows.
 */
export const runInterestLoanCronNow = async (targetDate = null) => {
  return await InterestLoanAccrualJob.runDailyAccrualJob(targetDate);
};

export default {
  startInterestLoanCron,
  stopInterestLoanCron,
  runInterestLoanCronNow,
};
