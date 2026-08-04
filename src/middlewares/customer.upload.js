import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BASE PATH
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

// CREATE FOLDERS

folders.forEach((folder) => {
  const folderPath = path.join(basePath, folder);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {
      recursive: true,
    });
  }
});

// STORAGE

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname;

    if (!folders.includes(folder)) {
      return cb(new Error("Invalid document type"), false);
    }

    cb(null, path.join(basePath, folder));
  },

  filename: (req, file, cb) => {
    const cleanName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + cleanName);
  },
});

// FILTER

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;

  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG PNG PDF allowed"));
  }
};

// MULTER

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

// FIELDS

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
