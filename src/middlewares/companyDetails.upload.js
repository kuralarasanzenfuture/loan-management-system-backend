import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  //   "documents/gst",
  //   "documents/pan",
  //   "documents/registration",
  //   "documents/license",
];

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

      //   case "gst_certificate":
      //     folder = "documents/gst";
      //     break;

      //   case "pan_document":
      //     folder = "documents/pan";
      //     break;

      //   case "registration_document":
      //     folder = "documents/registration";
      //     break;

      //   case "license_document":
      //     folder = "documents/license";
      //     break;
    }

    cb(null, path.join(basePath, folder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const clean = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + clean);
  },
});

/* =====================================================
   FILTER
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
export const companyUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
  { name: "stamp_image", maxCount: 1 },
  { name: "signature_image", maxCount: 1 },

  //   { name: "gst_certificate", maxCount: 1 },
  //   { name: "pan_document", maxCount: 1 },
  //   { name: "registration_document", maxCount: 1 },
  //   { name: "license_document", maxCount: 1 },
]);
