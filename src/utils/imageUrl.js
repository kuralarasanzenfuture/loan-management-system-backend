const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/**
 * Resolves a relative image path into a full public URL.
 * Handles existing full URLs (http/https) and relative paths.
 */
export function getImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
