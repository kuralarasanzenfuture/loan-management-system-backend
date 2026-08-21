import AnalyticsModel from "./analytics.model.js";

const AnalyticsService = {
  async getDashboard(filters = {}) {
    return AnalyticsModel.getDashboard(filters);
  },
};

export default AnalyticsService;
