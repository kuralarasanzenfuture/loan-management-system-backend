import dayjs from "dayjs";
import { InterestLoanAccrualJob } from "./interestLoanAccrual.job.js";
import { InterestLoanReconciliationService } from "../reconciliation/interestLoanReconciliation.service.js";

export const InterestLoanCronController = {
  /**
   * POST /api/interest-loans/cron/run
   * Trigger manual accrual run (e.g. for a specific target_date or today)
   */
  async triggerCronRun(req, res) {
    try {
      const targetDate = req.body.target_date || req.query.target_date || null;
      if (targetDate && !dayjs(targetDate, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid target_date format. Please use YYYY-MM-DD.",
        });
      }

      const result = await InterestLoanAccrualJob.runDailyAccrualJob(targetDate, {
        requestId: req.headers["x-request-id"] || null,
      });

      return res.status(200).json({
        success: true,
        message: result.skipped
          ? `Job skipped: ${result.reason}`
          : "Daily interest accrual job completed successfully",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed executing interest accrual cron",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/interest-loans/cron/reconcile
   * Trigger manual reconciliation run
   */
  async triggerReconciliation(req, res) {
    try {
      const targetDate = req.body.target_date || req.query.target_date || null;
      const loanId = req.body.loan_id ? parseInt(req.body.loan_id, 10) : null;

      if (targetDate && !dayjs(targetDate, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid target_date format. Please use YYYY-MM-DD.",
        });
      }

      const result = await InterestLoanReconciliationService.runReconciliation({
        targetDate,
        loanId,
      });

      return res.status(200).json({
        success: true,
        message: "Financial reconciliation completed successfully",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed executing financial reconciliation",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/interest-loans/cron/reconcile/reports
   * List reconciliation reports
   */
  async getReconciliationReports(req, res) {
    try {
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const offset = (page - 1) * limit;

      const { reports, total } = await InterestLoanReconciliationService.getReports(
        limit,
        offset
      );

      return res.status(200).json({
        success: true,
        data: reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed retrieving reconciliation reports",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/interest-loans/cron/reconcile/reports/:id/discrepancies
   * List discrepancies for a specific report
   */
  async getReportDiscrepancies(req, res) {
    try {
      const reportId = parseInt(req.params.id, 10);
      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID",
        });
      }

      const discrepancies =
        await InterestLoanReconciliationService.getDiscrepanciesByReportId(reportId);

      return res.status(200).json({
        success: true,
        data: discrepancies,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed retrieving report discrepancies",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/interest-loans/cron/status
   * Check cron health and whether today's accrual ran successfully
   */
  async getCronStatus(req, res) {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const latest = await InterestLoanAccrualJob.getLatestExecution();

      const ranToday = Boolean(
        latest && dayjs(latest.execution_date).isSame(today, "day")
      );

      return res.status(200).json({
        success: true,
        data: {
          current_date: today,
          scheduler_active: true,
          ran_today: ranToday,
          latest_execution: latest,
          health_status:
            !latest || latest.status === "FAILED"
              ? "CRITICAL"
              : latest.status === "PARTIAL"
              ? "WARNING"
              : "HEALTHY",
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed retrieving cron status",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/interest-loans/cron/logs
   * Retrieve paginated history of cron executions
   */
  async getCronLogs(req, res) {
    try {
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const offset = (page - 1) * limit;

      const { logs, total } = await InterestLoanAccrualJob.getExecutionLogs(
        limit,
        offset
      );

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed retrieving cron execution logs",
        error: error.message,
      });
    }
  },
};

export default InterestLoanCronController;
