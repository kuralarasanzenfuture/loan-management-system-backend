import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { ensureDirExists } from "../utils/fileHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   BASE PATH
===================================================== */
const basePath = path.join(__dirname, "../uploads/company");

/* =====================================================
   FOLDERS
===================================================== */
const folders = [
  "logo",
  "favicon",
  "stamp",
  "signature",
  "others",
];

ensureDirExists(basePath);
folders.forEach((folder) => {
  const fullPath = path.join(basePath, folder);
  ensureDirExists(fullPath);
});

/* =====================================================
   STORAGE
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    switch (file.fieldname) {
      case "logo":
        folder = "logo";
        break;

      case "favicon":
        folder = "favicon";
        break;

      case "stamp_image":
        folder = "stamp";
        break;

      case "signature_image":
        folder = "signature";
        break;
    }

    const dest = path.join(basePath, folder);
    ensureDirExists(dest);
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1000000)}${ext}`;
    cb(null, filename);
  },
});

/* =====================================================
   FILTER
===================================================== */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error("Only JPG, JPEG, PNG, WEBP and PDF files are allowed");
    error.status = 400;
    cb(error, false);
  }
};

/* =====================================================
   EXPORT
===================================================== */
export const companyUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
  { name: "stamp_image", maxCount: 1 },
  { name: "signature_image", maxCount: 1 },
]);
