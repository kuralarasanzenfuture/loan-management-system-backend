import {
  createCategorySchema,
  updateCategorySchema,
} from "./assetCategory.validation.js";
import AssetCategoryService from "./assetCategory.service.js";

export const createCategory = async (req, res, next) => {
  try {
    const data = await createCategorySchema.validateAsync(req.body);

    const result = await AssetCategoryService.create(data);

    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const result = await AssetCategoryService.getAll(req.query);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const result = await AssetCategoryService.getById(req.params.id);

    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await updateCategorySchema.validateAsync(req.body);

    const result = await AssetCategoryService.update(req.params.id, data);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const result = await AssetCategoryService.delete(req.params.id);

    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};
