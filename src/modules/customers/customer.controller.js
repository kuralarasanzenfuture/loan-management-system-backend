import { CustomerService } from "./customer.service.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.validation.js";
import { cleanupUploadedFiles } from "../../utils/fileHelper.js";

export const createCustomer = async (req, res, next) => {
  try {
    const data = await createCustomerSchema.validateAsync(req.body, {
      allowUnknown: true,
    });

    const result = await CustomerService.create(data, req.user, req.files);

    res.status(201).json({
      success: true,
      data: result.data || result,
      message: result.message,
    });
  } catch (err) {
    // 🧹 Delete newly uploaded files on error to prevent orphan files
    cleanupUploadedFiles(req.files);
    next(err);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const result = await CustomerService.getAll();

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const result = await CustomerService.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const data = await updateCustomerSchema.validateAsync(req.body, {
      allowUnknown: true,
    });

    const result = await CustomerService.update(
      req.params.id,
      data,
      req.files,
    );

    res.json({
      success: true,
      data: result.data || result,
      message: result.message,
    });
  } catch (err) {
    // 🧹 Delete newly uploaded files on error to prevent orphan files
    cleanupUploadedFiles(req.files);
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await CustomerService.delete(req.params.id);

    res.json({
      success: true,
      id: req.params.id,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerPhoto = async (req, res, next) => {
  try {
    const result = await CustomerService.deletePhoto(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerDocument = async (req, res, next) => {
  try {
    const result = await CustomerService.deleteDocument(
      req.params.id,
      req.params.documentId,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerDocumentByType = async (req, res, next) => {
  try {
    const result = await CustomerService.deleteDocumentByType(
      req.params.id,
      req.params.documentType,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
