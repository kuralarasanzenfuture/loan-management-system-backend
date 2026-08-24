import DashboardService from "./dashboard.service.js";

/* =========================================================
   DASHBOARD OVERVIEW
========================================================= */

export const getDashboardOverview = async (req, res, next) => {
  try {
    const result = await DashboardService.getDashboardOverview(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   PORTFOLIO TRENDS
========================================================= */

export const getPortfolioTrends = async (req, res, next) => {
  try {
    const result = await DashboardService.getPortfolioTrends(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   LOAN PLAN MIX
========================================================= */

export const getLoanPlanMix = async (req, res, next) => {
  try {
    const result = await DashboardService.getLoanPlanMix(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPortfolioHealth = async (req, res, next) => {
  try {
    const result = await DashboardService.getPortfolioHealth(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getRecentLoans = async (req, res, next) => {
  try {
    const data = await DashboardService.getRecentLoans(req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getQuickInsights = async (req, res, next) => {
  try {
    const data = await DashboardService.getQuickInsights(req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getTopLoanOfficers = async (req, res, next) => {
  try {
    const data = await DashboardService.getTopLoanOfficers(req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
