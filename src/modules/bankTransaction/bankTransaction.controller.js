import { createTransactionSchema } from "./bankTransaction.validation.js";
import BankTransactionService from "./bankTransaction.service.js";

export const createBankTransaction = async (req, res, next) => {
  try {
    const data = await createTransactionSchema.validateAsync(req.body);

    const result = await BankTransactionService.create(data, req.user);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getBankTransactions = async (req, res, next) => {
  try {
    const result = await BankTransactionService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getBankTransactionById = async (req, res, next) => {
  try {
    const data = await BankTransactionService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getBankTransactionByNumber = async (req, res, next) => {
  try {
    const data = await BankTransactionService.getByNumber(
      req.params.transaction_no,
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getBankTransactionSummary = async (req, res, next) => {
  try {
    const data = await BankTransactionService.summary(
      req.query.company_bank_id,
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const reverseBankTransaction = async (req, res, next) => {
  try {
    const result = await BankTransactionService.reverse(
      req.params.id,
      req.user,
    );
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};
