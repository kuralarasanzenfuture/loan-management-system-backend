import cron from "node-cron";
import { InterestLoanAccrualJob } from "./interestLoanAccrual.job.js";
import { InterestLoanReconciliationService } from "../reconciliation/interestLoanReconciliation.service.js";

let accrualCronInstance = null;
let reconCronInstance = null;
let isAccrualRunningLocally = false;
let isReconRunningLocally = false;

/**
 * START DAILY ACCRUAL & RECONCILIATION CRON SCHEDULERS
 * Accrual: 12:05 AM every day ('5 0 * * *')
 * Reconciliation: 2:00 AM every day ('0 2 * * *')
 * Default Timezone: Asia/Kolkata (+05:30)
 */
export const startInterestLoanCron = () => {
  const accrualSchedule = process.env.INTEREST_LOAN_CRON_SCHEDULE || "5 0 * * *";
  const reconSchedule = process.env.INTEREST_LOAN_RECON_SCHEDULE || "0 2 * * *";
  const timezone = process.env.TIMEZONE || "Asia/Kolkata";

  // 1. Initialize Daily Accrual Cron
  if (!accrualCronInstance) {
    console.log(
      `⏳ [Interest Loan Scheduler] Registering daily interest accrual at '${accrualSchedule}' (${timezone})...`
    );

    accrualCronInstance = cron.schedule(
      accrualSchedule,
      async () => {
        if (isAccrualRunningLocally) {
          console.warn(
            "⚠️ [Interest Loan Scheduler] Accrual thread already executing locally. Skipping overlap."
          );
          return;
        }

        isAccrualRunningLocally = true;
        try {
          console.log("⏰ [Interest Loan Scheduler] Scheduled accrual trigger activated.");
          await InterestLoanAccrualJob.runDailyAccrualJob();
        } catch (error) {
          console.error(
            "❌ [Interest Loan Scheduler] Error during scheduled accrual:",
            error.message
          );
        } finally {
          isAccrualRunningLocally = false;
        }
      },
      { timezone }
    );
    console.log("✅ [Interest Loan Scheduler] Daily interest accrual scheduler active.");
  }

  // 2. Initialize Daily Reconciliation Cron
  if (!reconCronInstance) {
    console.log(
      `⏳ [Interest Loan Scheduler] Registering daily reconciliation at '${reconSchedule}' (${timezone})...`
    );

    reconCronInstance = cron.schedule(
      reconSchedule,
      async () => {
        if (isReconRunningLocally) {
          console.warn(
            "⚠️ [Interest Loan Scheduler] Reconciliation thread already executing locally. Skipping overlap."
          );
          return;
        }

        isReconRunningLocally = true;
        try {
          console.log("⏰ [Interest Loan Scheduler] Scheduled reconciliation trigger activated.");
          await InterestLoanReconciliationService.runReconciliation();
        } catch (error) {
          console.error(
            "❌ [Interest Loan Scheduler] Error during scheduled reconciliation:",
            error.message
          );
        } finally {
          isReconRunningLocally = false;
        }
      },
      { timezone }
    );
    console.log("✅ [Interest Loan Scheduler] Daily reconciliation scheduler active.");
  }

  return {
    accrualCron: accrualCronInstance,
    reconCron: reconCronInstance,
  };
};

/**
 * STOP ALL CRON SCHEDULERS
 */
export const stopInterestLoanCron = () => {
  if (accrualCronInstance) {
    accrualCronInstance.stop();
    accrualCronInstance = null;
    console.log("🛑 [Interest Loan Scheduler] Accrual scheduler stopped.");
  }
  if (reconCronInstance) {
    reconCronInstance.stop();
    reconCronInstance = null;
    console.log("🛑 [Interest Loan Scheduler] Reconciliation scheduler stopped.");
  }
};

/**
 * MANUAL EXECUTION TRIGGERS
 */
export const runInterestLoanCronNow = async (targetDate = null, options = {}) => {
  return await InterestLoanAccrualJob.runDailyAccrualJob(targetDate, options);
};

export const runInterestLoanReconciliationNow = async (options = {}) => {
  return await InterestLoanReconciliationService.runReconciliation(options);
};

export default {
  startInterestLoanCron,
  stopInterestLoanCron,
  runInterestLoanCronNow,
  runInterestLoanReconciliationNow,
};
