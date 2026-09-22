/**
 * Backward compatibility proxy module.
 * Delegates all operations to the production-ready InterestLoanAccrualService & InterestLoanAccrualJob.
 */
import { InterestLoanAccrualService } from "../cron/interestLoanAccrual.service.js";
import { InterestLoanAccrualJob } from "../cron/interestLoanAccrual.job.js";

export const InterestLoanPeriodCronService = {
  computeNextInterestDate(startDate, frequency, cycleNumber = 1) {
    return InterestLoanAccrualService.computeNextInterestDate(
      startDate,
      frequency,
      cycleNumber
    );
  },

  calculateInterestAmount(principal, rate, type) {
    return InterestLoanAccrualService.calculateInterestAmount(
      principal,
      rate,
      type
    );
  },

  async generateNextPeriodForLoan(loanId, options = {}, externalConn = null) {
    return await InterestLoanAccrualService.generateNextPeriodForLoan(
      loanId,
      options,
      externalConn
    );
  },

  async processSingleLoanAccrual(loanId, targetDate = null, externalConn = null) {
    return await InterestLoanAccrualService.processSingleLoanAccrual(
      loanId,
      targetDate,
      externalConn
    );
  },

  async processDailyInterestAccruals(targetDate = null) {
    return await InterestLoanAccrualJob.runDailyAccrualJob(targetDate);
  },
};

export default InterestLoanPeriodCronService;
