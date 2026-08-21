import AnalyticsService from "./analytics.service.js";

/* =========================================================
   GET DASHBOARD SUMMARY
   GET /api/reports/dashboard
========================================================= */

export const getDashboard = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getDashboard(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
