import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureDirExists } from "../utils/fileHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BASE UPLOADS PATH
const basePath = path.join(__dirname, "../uploads/customers");

// DOCUMENT FOLDERS
const folders = [
  "photo",
  "aadhaar",
  "pan",
  "driving_license",
  "voter_id",
  "passport",
  "ration_card",
  "bank_passbook",
  "salary_slip",
  "electricity_bill",
  "gas_bill",
  "other",
];

// AUTO CREATE FOLDERS
ensureDirExists(basePath);
folders.forEach((folder) => {
  const folderPath = path.join(basePath, folder);
  ensureDirExists(folderPath);
});

// STORAGE CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname;

    if (!folders.includes(folder)) {
      return cb(new Error(`Invalid document type: ${folder}`), false);
    }

    const dest = path.join(basePath, folder);
    ensureDirExists(dest);
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1000000)}${extension}`;
    cb(null, filename);
  },
});

// FILE FILTER
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExtensions.includes(ext);
  const isValidMime = allowedMimeTypes.includes(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    const error = new Error("Only JPG, JPEG, PNG, WEBP and PDF files are allowed");
    error.status = 400;
    cb(error, false);
  }
};

// MULTER INSTANCE
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

// MULTI-FIELD EXPORT
export const customerUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "driving_license", maxCount: 1 },
  { name: "voter_id", maxCount: 1 },
  { name: "passport", maxCount: 1 },
  { name: "ration_card", maxCount: 1 },
  { name: "bank_passbook", maxCount: 1 },
  { name: "salary_slip", maxCount: 5 },
  { name: "electricity_bill", maxCount: 2 },
  { name: "gas_bill", maxCount: 2 },
  { name: "other", maxCount: 5 },
]);
