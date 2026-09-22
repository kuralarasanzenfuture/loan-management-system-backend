import dayjs from "dayjs";
import { InterestLoanAccrualJob } from "./interestLoanAccrual.job.js";

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

      const result = await InterestLoanAccrualJob.runDailyAccrualJob(targetDate);
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
            !latest || latest.status === "failed"
              ? "CRITICAL"
              : latest.status === "partial"
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
