import { InterestLoanPeriodModel } from "./interestLoanPeriod.model.js";

/**
 * GET ALL PERIODS FOR A LOAN
 */
export const getPeriodsByLoanId = async (req, res, next) => {
  try {
    const loanId = req.params.loan_id;
    await InterestLoanPeriodModel.syncDueStatuses(loanId);
    const periods = await InterestLoanPeriodModel.getByLoanId(loanId);

    res.json({
      success: true,
      data: periods,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE PERIOD BY ID
 */
export const getPeriodById = async (req, res, next) => {
  try {
    const period = await InterestLoanPeriodModel.findById(req.params.id);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: "Interest loan period not found",
      });
    }

    res.json({
      success: true,
      data: period,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SYNC DUE STATUSES ACROSS ALL OR SPECIFIC LOAN
 */
export const syncDuePeriods = async (req, res, next) => {
  try {
    const loanId = req.query.loan_id || null;
    await InterestLoanPeriodModel.syncDueStatuses(loanId);

    res.json({
      success: true,
      message: loanId
        ? `Due statuses synchronized for loan #${loanId}`
        : "Due statuses synchronized across all interest loans",
    });
  } catch (err) {
    next(err);
  }
};
