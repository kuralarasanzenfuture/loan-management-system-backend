import DashboardModel from "./dashboard.model.js";

const DashboardService = {
  async getDashboardOverview(filters = {}) {
    return DashboardModel.getDashboardOverview(filters);
  },

  async getPortfolioTrends(filters = {}) {
    return DashboardModel.getPortfolioTrends(filters);
  },

  async getLoanPlanMix(filters = {}) {
    return DashboardModel.getLoanPlanMix(filters);
  },

  async getPortfolioHealth(filters = {}) {
    return DashboardModel.getPortfolioHealth(filters);
  },

  async getRecentLoans(filters = {}) {
    return DashboardModel.getRecentLoans(filters);
  },

  async getQuickInsights(filters = {}) {
    return DashboardModel.getQuickInsights(filters);
  },

  async getTopLoanOfficers(filters = {}) {
    return DashboardModel.getTopLoanOfficers(filters);
  },
};

export default DashboardService;
