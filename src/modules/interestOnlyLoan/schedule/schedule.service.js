import { ScheduleModel } from "./schedule.model.js";
import { InterestLoanModel } from "../loan/interestLoan.model.js";

export const ScheduleService = {
  async getByLoan(loan_id) {
    const loan = await InterestLoanModel.findById(loan_id);
    if (!loan) {
      throw { status: 404, message: "Interest-only loan not found" };
    }
    return await ScheduleModel.getByLoanId(loan_id);
  },

  async getPending(loan_id) {
    const loan = await InterestLoanModel.findById(loan_id);
    if (!loan) {
      throw { status: 404, message: "Interest-only loan not found" };
    }
    return await ScheduleModel.getPendingByLoanId(loan_id);
  },

  async getOverdue(loan_id) {
    const loan = await InterestLoanModel.findById(loan_id);
    if (!loan) {
      throw { status: 404, message: "Interest-only loan not found" };
    }
    return await ScheduleModel.getOverdueByLoanId(loan_id);
  },

  async getTodayCollections(dateOrFilters, status = "all", search = "") {
    let date = dateOrFilters;
    if (typeof dateOrFilters === "object" && dateOrFilters !== null) {
      date = dateOrFilters.date;
      status = dateOrFilters.status || "all";
      search = dateOrFilters.search || "";
    }
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const data = await ScheduleModel.findTodayCollections(targetDate, status, search);

    const total_due = data.reduce((sum, row) => sum + Number(row.total_due || 0), 0);
    const total_collected = data.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
    const total_balance = data.reduce((sum, row) => sum + Number(row.balance_amount || 0), 0);

    return {
      date: targetDate,
      count: data.length,
      summary: {
        total_due: Number(total_due.toFixed(2)),
        total_collected: Number(total_collected.toFixed(2)),
        total_balance: Number(total_balance.toFixed(2)),
      },
      data,
    };
  },

  async getOverdueCollectionsGlobal(searchOrFilters = "", conn = null) {
    let search = searchOrFilters;
    if (typeof searchOrFilters === "object" && searchOrFilters !== null) {
      search = searchOrFilters.search || "";
      conn = searchOrFilters.conn || conn;
    }
    const data = await ScheduleModel.findOverdueCollectionsGlobal(search, conn);
    const total_overdue = data.reduce((sum, row) => sum + Number(row.balance_amount || 0), 0);

    return {
      count: data.length,
      total_overdue_amount: Number(total_overdue.toFixed(2)),
      data,
    };
  },

  async getById(id) {
    const schedule = await ScheduleModel.getById(id);
    if (!schedule) {
      throw { status: 404, message: "Loan schedule not found" };
    }
    return schedule;
  },
};
