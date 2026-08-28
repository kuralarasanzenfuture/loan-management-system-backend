import ModuleService from "./modules.service.js";
import {
  createModuleSchema,
  updateModuleSchema,
  modulesQuerySchema,
  idParamSchema,
} from "./modules.validation.js";

export const createModule = async (req, res, next) => {
  try {
    const data = await createModuleSchema.validateAsync(req.body);
    const result = await ModuleService.create(data);

    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getModules = async (req, res, next) => {
  try {
    const query = await modulesQuerySchema.validateAsync(req.query);
    const data = await ModuleService.getAll(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getModuleTree = async (req, res, next) => {
  try {
    const data = await ModuleService.getTree();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getModuleById = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const data = await ModuleService.getById(id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const updateModule = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const data = await updateModuleSchema.validateAsync(req.body);
    const result = await ModuleService.update(id, data);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const toggleModuleStatus = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const result = await ModuleService.toggleStatus(id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const deleteModule = async (req, res, next) => {
  try {
    const { id } = await idParamSchema.validateAsync(req.params);
    const result = await ModuleService.delete(id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};
