import ReportService from "./report.service.js";

export const getLoanCollections = async (req, res, next) => {
  try {
    const { date } = req.query;

    const result = await ReportService.getTodayCollections(date);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
