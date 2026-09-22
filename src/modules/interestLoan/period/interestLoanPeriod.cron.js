import cron from "node-cron";
import { InterestLoanPeriodCronService } from "./interestLoanPeriodCron.service.js";

let cronJobInstance = null;
let isCronRunning = false;

/**
 * START DAILY ACCRUAL CRON JOB
 * Schedule: 12:05 AM every day ('5 0 * * *')
 * Default Timezone: Asia/Kolkata (+05:30)
 */
export const startInterestLoanCron = () => {
  const cronExpression = process.env.INTEREST_LOAN_CRON_SCHEDULE || "5 0 * * *";
  const timezone = process.env.TIMEZONE || "Asia/Kolkata";

  if (cronJobInstance) {
    console.log("ℹ️ [Interest Loan Cron] Cron job already initialized.");
    return cronJobInstance;
  }

  console.log(
    `⏳ [Interest Loan Cron] Scheduling daily interest accrual at '${cronExpression}' (${timezone})...`
  );

  cronJobInstance = cron.schedule(
    cronExpression,
    async () => {
      if (isCronRunning) {
        console.warn(
          "⚠️ [Interest Loan Cron] Previous run is still active. Skipping concurrent execution."
        );
        return;
      }

      isCronRunning = true;
      try {
        console.log("⏰ [Interest Loan Cron] 12:05 AM Trigger activated.");
        await InterestLoanPeriodCronService.processDailyInterestAccruals();
      } catch (error) {
        console.error(
          "❌ [Interest Loan Cron] Error during scheduled accrual:",
          error.message
        );
      } finally {
        isCronRunning = false;
      }
    },
    {
      timezone,
    }
  );

  console.log("✅ [Interest Loan Cron] Daily interest accrual scheduler active.");
  return cronJobInstance;
};

/**
 * STOP CRON JOB
 */
export const stopInterestLoanCron = () => {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance = null;
    console.log("🛑 [Interest Loan Cron] Accrual scheduler stopped.");
  }
};

/**
 * MANUAL EXECUTION TRIGGER
 * Used by admin endpoint or test scripts
 */
export const runInterestLoanCronNow = async (targetDate = null) => {
  return await InterestLoanPeriodCronService.processDailyInterestAccruals(
    targetDate
  );
};
