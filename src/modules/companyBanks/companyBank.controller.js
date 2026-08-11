import CompanyBankService from "./companyBank.service.js";
import {
  createCompanyBankSchema,
  updateCompanyBankSchema,
} from "./companyBank.validation.js";

const parseBool = (val) => val === true || val === "true" || val === "1" || val === 1;

// Helper to extract uploaded file path and sanitize request body
const handleUploadedFiles = (req) => {
  if (req.files?.upi_qr_code?.[0]) {
    const filename = req.files.upi_qr_code[0].filename;
    req.body.upi_qr_code = `/uploads/company-banks/qr/${filename}`;
  }

  // Clean company_id if empty or literal string "undefined"/"null"
  if (
    req.body.company_id === "" ||
    req.body.company_id === "undefined" ||
    req.body.company_id === "null" ||
    req.body.company_id === null ||
    req.body.company_id === undefined
  ) {
    delete req.body.company_id;
  } else {
    const num = Number(req.body.company_id);
    if (!isNaN(num) && num > 0) {
      req.body.company_id = num;
    } else {
      delete req.body.company_id;
    }
  }

  // Coerce boolean string values from FormData ("1"/"0"/"true"/"false")
  if (req.body.is_primary !== undefined) {
    req.body.is_primary = parseBool(req.body.is_primary);
  }
  if (req.body.is_collection_account !== undefined) {
    req.body.is_collection_account = parseBool(req.body.is_collection_account);
  }
  if (req.body.is_disbursement_account !== undefined) {
    req.body.is_disbursement_account = parseBool(req.body.is_disbursement_account);
  }
};

export const createCompanyBank = async (req, res, next) => {
  try {
    handleUploadedFiles(req);

    const data = await createCompanyBankSchema.validateAsync(req.body);
    const result = await CompanyBankService.create(data, req.user);

    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getCompanyBanks = async (req, res, next) => {
  try {
    const result = await CompanyBankService.getAll(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const getCompanyBankById = async (req, res, next) => {
  try {
    const result = await CompanyBankService.getById(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const updateCompanyBank = async (req, res, next) => {
  try {
    handleUploadedFiles(req);

    const data = await updateCompanyBankSchema.validateAsync(req.body);
    const result = await CompanyBankService.update(
      req.params.id,
      data,
      req.user,
    );

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const deleteCompanyBank = async (req, res, next) => {
  try {
    const result = await CompanyBankService.delete(req.params.id);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const setPrimaryBank = async (req, res, next) => {
  try {
    const result = await CompanyBankService.setPrimaryBank(req.params.id);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};
