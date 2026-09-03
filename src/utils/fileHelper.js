import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories allowed for file storage & deletion
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const SRC_DIR = path.resolve(__dirname, "../");
const UPLOADS_ROOT = path.resolve(PROJECT_ROOT, "uploads");
const SRC_UPLOADS_ROOT = path.resolve(SRC_DIR, "uploads");

/**
 * Ensures a directory exists synchronously.
 * @param {string} dirPath
 */
export function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Resolves a stored relative path or URL to an absolute filesystem path.
 * Protects against path traversal attacks.
 * @param {string} filePathOrUrl
 * @returns {string|null} Resolved absolute path or null if invalid
 */
export function resolveUploadFilePath(filePathOrUrl) {
  if (!filePathOrUrl || typeof filePathOrUrl !== "string") {
    return null;
  }

  let cleanPath = filePathOrUrl.trim();

  // Strip query params or hash if any
  cleanPath = cleanPath.split("?")[0].split("#")[0];

  // If full URL (http://... or https://...), extract the pathname
  if (/^https?:\/\//i.test(cleanPath)) {
    try {
      const parsedUrl = new URL(cleanPath);
      cleanPath = parsedUrl.pathname;
    } catch {
      // Fallback if URL parsing fails
      cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/i, "");
    }
  }

  // Normalize leading slashes
  if (cleanPath.startsWith("/") || cleanPath.startsWith("\\")) {
    cleanPath = cleanPath.slice(1);
  }

  // Candidate absolute locations to search for the file
  const candidatePaths = [
    // 1. Direct path if already absolute
    path.isAbsolute(filePathOrUrl) ? path.normalize(filePathOrUrl) : null,
    // 2. Relative to PROJECT_ROOT (e.g. backend/uploads/...)
    path.resolve(PROJECT_ROOT, cleanPath),
    // 3. Relative to SRC_DIR (e.g. backend/src/uploads/...)
    path.resolve(SRC_DIR, cleanPath),
    // 4. Inside UPLOADS_ROOT
    path.resolve(UPLOADS_ROOT, cleanPath),
    // 5. Inside SRC_UPLOADS_ROOT
    path.resolve(SRC_UPLOADS_ROOT, cleanPath),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    const normalized = path.normalize(candidate);

    // 🔒 Security check: must reside inside PROJECT_ROOT
    if (!normalized.startsWith(PROJECT_ROOT)) {
      continue;
    }

    if (fs.existsSync(normalized)) {
      return normalized;
    }
  }

  // If file doesn't exist on disk, return standard target under SRC_DIR or PROJECT_ROOT
  const fallback = path.resolve(SRC_DIR, cleanPath);
  if (fallback.startsWith(PROJECT_ROOT)) {
    return fallback;
  }

  return null;
}

/**
 * Safely deletes a file from disk using fs.unlinkSync().
 * Prevents directory traversal and will not throw unhandled exceptions.
 * @param {string} filePathOrUrl
 * @returns {boolean} true if deleted, false otherwise
 */
export function deleteFile(filePathOrUrl) {
  if (!filePathOrUrl) return false;

  try {
    const resolvedPath = resolveUploadFilePath(filePathOrUrl);

    if (resolvedPath && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return true;
    }
  } catch (error) {
    console.error(`⚠️ Failed to delete file [${filePathOrUrl}]:`, error.message);
  }

  return false;
}

/**
 * Batch deletes multiple files.
 * @param {Array<string>} fileList
 * @returns {number} count of deleted files
 */
export function deleteFiles(fileList = []) {
  if (!Array.isArray(fileList)) return 0;
  let deletedCount = 0;

  for (const item of fileList) {
    if (item && deleteFile(item)) {
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Cleans up uploaded files created by Multer (req.files or req.file).
 * Useful for rollback when database operations fail.
 * @param {object|Array} files - req.files or req.file
 */
export function cleanupUploadedFiles(files) {
  if (!files) return;

  try {
    // Case 1: req.file (single file object)
    if (files.path) {
      if (fs.existsSync(files.path)) {
        fs.unlinkSync(files.path);
      }
      return;
    }

    // Case 2: req.files is an Array
    if (Array.isArray(files)) {
      for (const file of files) {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      return;
    }

    // Case 3: req.files is an Object with field arrays (e.g. { photo: [...], aadhaar: [...] })
    if (typeof files === "object") {
      for (const fieldKey of Object.keys(files)) {
        const fileVal = files[fieldKey];
        if (Array.isArray(fileVal)) {
          for (const file of fileVal) {
            if (file?.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        } else if (fileVal?.path && fs.existsSync(fileVal.path)) {
          fs.unlinkSync(fileVal.path);
        }
      }
    }
  } catch (err) {
    console.error("⚠️ Error during cleanupUploadedFiles:", err.message);
  }
}
