import ReportModel from "./report.model.js";

const ReportService = {
  async getTodayCollections(filters = {}) {
    let { date, from_date, to_date } = filters;

    // 🔥 Default → TODAY
    if (!date && !from_date && !to_date) {
      date = new Date().toISOString().slice(0, 10);
    }

    const rows = await ReportModel.findCollections({
      ...filters,
      date,
      from_date,
      to_date,
    });

    const total = rows.reduce(
      (sum, row) => sum + Number(row.paid_amount || 0),
      0
    );

    return {
      filters: {
        date,
        from_date,
        to_date,
        customer_id: filters.customer_id || null,
        loan_id: filters.loan_id || null,
      },
      count: rows.length,
      total_collected: Number(total.toFixed(2)),
      data: rows,
    };
  },
};

export default ReportService;