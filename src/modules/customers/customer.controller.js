import { CustomerService } from "./customer.service.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.validation.js";

export const createCustomer = async (req, res, next) => {
  try {
    const data = await createCustomerSchema.validateAsync(req.body);

    const result = await CustomerService.create(data, req.user, req.files);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
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
    const data = await updateCustomerSchema.validateAsync(req.body);

    const result = await CustomerService.update(
      req.params.id,
      data,
      req.files,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await CustomerService.delete(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
