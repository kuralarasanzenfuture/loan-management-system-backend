import CompanyService from "./companyDetails.service.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "./companyDetails.validation.js";

/* =====================================================
   HELPER – extract uploaded file paths from req.files
   multer.fields stores files as: { fieldname: [FileObj] }
   Subfolder mapping must match companyDetails.upload.js
===================================================== */
const FIELD_TO_SUBFOLDER = {
  logo: "logo",
  favicon: "favicon",
  stamp_image: "stamp",
  signature_image: "signature",
};

function extractFilePaths(files = {}) {
  const map = {};

  Object.entries(FIELD_TO_SUBFOLDER).forEach(([fieldName, subfolder]) => {
    if (files[fieldName]?.[0]) {
      // URL served by Express static: /uploads/company/{subfolder}/{filename}
      map[fieldName] = `/uploads/company/${subfolder}/${files[fieldName][0].filename}`;
    }
  });

  return map;
}

// Map remove flags to database columns
const REMOVE_FIELDS = {
  remove_logo: "logo",
  remove_favicon: "favicon",
  remove_stamp_image: "stamp_image",
  remove_signature_image: "signature_image",
};

export const createCompany = async (req, res, next) => {
  try {
    const data = await createCompanySchema.validateAsync(req.body, {
      allowUnknown: true,
      abortEarly: false,
    });

    // Merge uploaded file paths
    const filePaths = extractFilePaths(req.files);
    const payload = { ...data, ...filePaths };

    // Handle removal of images if flagged
    Object.entries(REMOVE_FIELDS).forEach(([removeKey, dbField]) => {
      if (req.body[removeKey] === "true" || req.body[removeKey] === true) {
        payload[dbField] = null;
      }
      delete payload[removeKey];
    });

    const result = await CompanyService.create(payload, req.user);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    // Singleton: returns null when no company exists (first-time setup)
    const result = await CompanyService.get();

    res.json({
      success: true,
      data: result, // null OR the single company object
    });
  } catch (e) {
    next(e);
  }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await CompanyService.getById(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const data = await updateCompanySchema.validateAsync(req.body, {
      allowUnknown: true,
      abortEarly: false,
    });

    // Merge uploaded file paths
    const filePaths = extractFilePaths(req.files);
    const payload = { ...data, ...filePaths };

    // Handle removal of images if flagged
    Object.entries(REMOVE_FIELDS).forEach(([removeKey, dbField]) => {
      if (req.body[removeKey] === "true" || req.body[removeKey] === true) {
        payload[dbField] = null;
      }
      delete payload[removeKey];
    });

    const result = await CompanyService.update(
      req.params.id,
      payload,
      req.user,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const result = await CompanyService.delete(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};
