import { clampPercent, parseJsonValue } from "../utils.js";

export function normalizeGalleryMode(value) {
  return String(value || "").toLowerCase() === "carousel" ? "carousel" : "grid";
}

export function normalizeGalleryStyle(value) {
  const style = String(value || "").toLowerCase();
  if (["elegant", "soft", "polaroid", "clean"].includes(style)) return style;
  return "elegant";
}

export function normalizeGalleryPhotoFocusMap(input) {
  const source = parseJsonValue(input, {});
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const normalized = {};
  Object.keys(source).forEach((rawKey) => {
    const key = String(rawKey || "").trim();
    if (!key) return;
    const item = source[rawKey];
    if (!item || typeof item !== "object") return;
    normalized[key] = {
      x: clampPercent(item.x, 50),
      y: clampPercent(item.y, 50)
    };
  });

  return normalized;
}
