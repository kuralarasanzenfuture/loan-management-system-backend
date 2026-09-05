import { ScheduleService } from "./schedule.service.js";

export const getLoanSchedules = async (req, res, next) => {
  try {
    const result = await ScheduleService.getByLoan(req.params.loan_id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPendingSchedules = async (req, res, next) => {
  try {
    const result = await ScheduleService.getPending(req.params.loan_id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getOverdueSchedules = async (req, res, next) => {
  try {
    const result = await ScheduleService.getOverdue(req.params.loan_id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getScheduleById = async (req, res, next) => {
  try {
    const result = await ScheduleService.getById(req.params.id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getTodayCollections = async (req, res, next) => {
  try {
    const { date, status, search } = req.query;
    const result = await ScheduleService.getTodayCollections(date, status, search);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getOverdueCollectionsGlobal = async (req, res, next) => {
  try {
    const { search } = req.query;
    const result = await ScheduleService.getOverdueCollectionsGlobal(search);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
