export const parseBoolean = (value) => {
  if (value === undefined || value === null) return false;

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();

    if (["true", "1", "yes", "y", "on"].includes(v)) return true;
    if (["false", "0", "no", "n", "off", ""].includes(v)) return false;
  }

  throw { status: 400, message: "Invalid boolean value" };
};