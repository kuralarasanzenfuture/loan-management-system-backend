import ModuleActionService from "./moduleActions.service.js";
import {
  createModuleActionSchema,
  updateModuleActionSchema,
  moduleActionQuerySchema,
  idParamSchema,
  moduleIdParamSchema,
} from "./moduleActions.validation.js";

export const createModuleAction = async (req, res, next) => {
  try {
    const data = await createModuleActionSchema.validateAsync(req.body);

    const result = await ModuleActionService.create(data);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const getAllModuleActions = async (req, res, next) => {
  try {
    const query = await moduleActionQuerySchema.validateAsync(req.query);
    const data = await ModuleActionService.getAll(query);

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const getActionsByModule = async (req, res, next) => {
  try {
    const { module_id } = await moduleIdParamSchema.validateAsync(req.params);
    const data = await ModuleActionService.getByModule(module_id);

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const getModuleActionById = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const data = await ModuleActionService.getById(id);

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const updateModuleAction = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const data = await updateModuleActionSchema.validateAsync(req.body);

    const result = await ModuleActionService.update(id, data);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const toggleModuleActionStatus = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const result = await ModuleActionService.toggleStatus(id);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const deleteModuleAction = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const result = await ModuleActionService.delete(id);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const getModuleActionsTree = async (req, res, next) => {
  try {
    const data = await ModuleActionService.getTree();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getModuleActionsFlat = async (req, res, next) => {
  try {
    const data = await ModuleActionService.getFlat();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
