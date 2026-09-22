/**
 * Backward compatibility re-export wrapper.
 * Directly proxies to the dedicated scheduler in src/modules/interestLoan/cron/interestLoanCron.scheduler.js
 */
export {
  startInterestLoanCron,
  stopInterestLoanCron,
  runInterestLoanCronNow,
} from "../cron/interestLoanCron.scheduler.js";

import scheduler from "../cron/interestLoanCron.scheduler.js";
export default scheduler;
