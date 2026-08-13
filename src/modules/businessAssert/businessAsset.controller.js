import BusinessAssetService from "./businessAsset.service.js";
import {
  createAssetSchema,
  updateAssetSchema,
} from "./businessAsset.validation.js";

export const createAsset = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.image = `/uploads/assets/${req.file.filename}`;
    }
    const data = await createAssetSchema.validateAsync(payload);
    const result = await BusinessAssetService.create(data, req.user);
    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const result = await BusinessAssetService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const result = await BusinessAssetService.getById(req.params.id);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.image = `/uploads/assets/${req.file.filename}`;
    } else if (payload.remove_image === "true" || payload.remove_image === true) {
      payload.image = null;
    }
    delete payload.remove_image;

    const data = await updateAssetSchema.validateAsync(payload);
    const result = await BusinessAssetService.update(
      req.params.id,
      data,
      req.user,
    );
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const updateAssetStatus = async (req, res, next) => {
  try {
    const result = await BusinessAssetService.updateStatus(
      req.params.id,
      req.body.status,
      req.user,
    );
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const result = await BusinessAssetService.delete(req.params.id);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};
