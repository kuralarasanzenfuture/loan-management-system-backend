import { InterestLoanPeriodModel } from "./interestLoanPeriod.model.js";
import { InterestLoanPeriodCronService } from "./interestLoanPeriodCron.service.js";

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

/**
 * TRIGGER ACCRUAL CRON MANUALLY (For testing or operator execution)
 */
export const triggerAccrualCron = async (req, res, next) => {
  try {
    const { date, loan_id } = req.body || {};

    if (loan_id) {
      const result = await InterestLoanPeriodCronService.processSingleLoanAccrual(
        loan_id,
        date || new Date()
      );
      return res.json({
        success: true,
        message: `Accrual processing executed for loan #${loan_id}`,
        data: result,
      });
    }

    const summary = await InterestLoanPeriodCronService.processDailyInterestAccruals(
      date || null
    );

    res.json({
      success: true,
      message: "Daily interest accrual cron job executed successfully",
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * MANUALLY GENERATE NEXT PERIOD FOR LOAN (Secondary API)
 * POST /api/interest-loans/periods/generate/:loan_id
 */
export const generateLoanPeriodManual = async (req, res, next) => {
  try {
    const loanId = req.params.loan_id || req.params.id;
    const result = await InterestLoanPeriodCronService.generateNextPeriodForLoan(
      loanId,
      req.body || {}
    );

    if (result.already_exists) {
      return res.status(200).json({
        success: true,
        already_exists: true,
        message: result.message,
        data: result,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET TODAY'S COLLECTIONS
 * GET /api/interest-loans/periods/collections/today
 */
export const getTodayCollections = async (req, res, next) => {
  try {
    const result = await InterestLoanPeriodModel.getTodayCollections(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET OVERDUE COLLECTIONS
 * GET /api/interest-loans/periods/collections/overdue
 */
export const getOverdueCollections = async (req, res, next) => {
  try {
    const result = await InterestLoanPeriodModel.getOverdueCollections(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UNIFIED COLLECTIONS OVERVIEW
 * GET /api/interest-loans/periods/collections?type=all|today|overdue
 */
export const getCollectionsOverview = async (req, res, next) => {
  try {
    const result = await InterestLoanPeriodModel.getCollectionsOverview(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};



