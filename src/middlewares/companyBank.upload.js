import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   BASE PATH
===================================================== */
const basePath = path.join(__dirname, "../uploads/company-banks");

/* =====================================================
   FOLDERS
===================================================== */
const folders = ["qr"];

folders.forEach((folder) => {
  const fullPath = path.join(basePath, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/* =====================================================
   STORAGE
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "documents/other";

    switch (file.fieldname) {
      case "upi_qr_code":
        folder = "qr";
        break;
    }

    cb(null, path.join(basePath, folder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const cleanName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + cleanName);
  },
});

/* =====================================================
   FILE FILTER
===================================================== */
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;

  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) cb(null, true);
  else cb(new Error("Only JPG, PNG, PDF allowed"));
};

/* =====================================================
   EXPORT
===================================================== */
export const companyBankUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).fields([{ name: "upi_qr_code", maxCount: 1 }]);
