import InterestReportService from "./interestReport.service.js";

export const getInterestCollectionReports = async (req, res, next) => {
  try {
    const result = await InterestReportService.getCollections(req.query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getInterestCollectionReports,
};
