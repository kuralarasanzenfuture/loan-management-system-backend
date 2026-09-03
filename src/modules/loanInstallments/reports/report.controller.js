import ReportService from "./report.service.js";

export const getLoanCollections = async (req, res, next) => {
  try {
    const result = await ReportService.getTodayCollections(req.query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
