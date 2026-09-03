import ReportModel from "./report.model.js";

const ReportService = {
  async getTodayCollections(filters = {}) {
    if (typeof filters === "string") {
      filters = { date: filters };
    }

    let { date, from_date, to_date } = filters;

    const hasSearchCriteria = Boolean(
      filters.search ||
      filters.customer_name ||
      filters.phone ||
      filters.mobile ||
      filters.loan_no ||
      filters.customer_id ||
      filters.loan_id
    );

    if (!date && !from_date && !to_date && !hasSearchCriteria && filters.all !== "true") {
      date = new Date().toISOString().slice(0, 10);
    }

    const rows = await ReportModel.findCollections({
      ...filters,
      date: date && date !== "all" ? date : undefined,
      from_date,
      to_date,
    });

    const total = rows.reduce(
      (sum, row) => sum + Number(row.paid_amount || 0),
      0
    );

    return {
      filters: {
        date: date || null,
        from_date: from_date || null,
        to_date: to_date || null,
        search: filters.search || null,
        customer_name: filters.customer_name || null,
        phone: filters.phone || filters.mobile || null,
        loan_no: filters.loan_no || null,
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
