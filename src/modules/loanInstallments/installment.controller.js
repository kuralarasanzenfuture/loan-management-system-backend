import LoanInstallmentService from "./installment.service.js";

/* =========================================================
   GET ALL INSTALLMENTS BY LOAN
   GET /api/loan-installments/loan/:loanId
========================================================= */

export const getInstallmentsByLoan = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    const result = await LoanInstallmentService.getByLoan(loanId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET INSTALLMENT BY ID
   GET /api/loan-installments/:id
========================================================= */

export const getInstallmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await LoanInstallmentService.getById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   UPDATE INSTALLMENT / PAYMENT
   PUT /api/loan-installments/:id
========================================================= */

export const updateInstallment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await LoanInstallmentService.update(id, req.body, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
