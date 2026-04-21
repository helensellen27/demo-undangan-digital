export function parseJsonValue(input, fallback) {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch (error) {
    return fallback;
  }
}

export function cleanPhotoArray(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => String(item || "").trim()).filter(Boolean);
}

export function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(text);
}

export function clampPercent(value, fallback = 50) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, num));
}

export function normalizeCountString(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  const num = Number(clean);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(Math.floor(num));
}

export function normalizePositiveNumberString(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  const num = Number(clean);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(num);
}
