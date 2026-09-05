import InterestReportModel from "./interestReport.model.js";

const InterestReportService = {
  async getCollections(filters = {}) {
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
      filters.loan_id ||
      (filters.payment_mode && filters.payment_mode !== "all")
    );

    if (!date && !from_date && !to_date && !hasSearchCriteria && filters.all !== "true") {
      date = new Date().toISOString().slice(0, 10);
    }

    const rows = await InterestReportModel.findCollections({
      ...filters,
      date: date && date !== "all" ? date : undefined,
      from_date,
      to_date,
    });

    const totalCollected = rows.reduce(
      (sum, row) => sum + Number(row.payment_amount || 0),
      0
    );

    const totalInterest = rows.reduce(
      (sum, row) => sum + Number(row.interest_amount || 0),
      0
    );

    const totalPrincipal = rows.reduce(
      (sum, row) => sum + Number(row.principal_amount || 0),
      0
    );

    const uniqueCustomers = new Set(rows.map((r) => r.customer_id).filter(Boolean)).size;

    return {
      filters: {
        date: date || null,
        from_date: from_date || null,
        to_date: to_date || null,
        search: filters.search || null,
        customer_name: filters.customer_name || null,
        phone: filters.phone || filters.mobile || null,
        loan_no: filters.loan_no || null,
        payment_mode: filters.payment_mode || null,
        customer_id: filters.customer_id || null,
        loan_id: filters.loan_id || null,
      },
      count: rows.length,
      total_collected: Number(totalCollected.toFixed(2)),
      total_interest_collected: Number(totalInterest.toFixed(2)),
      total_principal_collected: Number(totalPrincipal.toFixed(2)),
      unique_customers: uniqueCustomers,
      summary: {
        total_collected: Number(totalCollected.toFixed(2)),
        total_interest_collected: Number(totalInterest.toFixed(2)),
        total_principal_collected: Number(totalPrincipal.toFixed(2)),
        unique_customers: uniqueCustomers,
        total_records: rows.length,
      },
      data: rows,
    };
  },
};

export default InterestReportService;
