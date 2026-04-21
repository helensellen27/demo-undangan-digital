export function extractDriveFileId(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  const idFromQuery = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idFromQuery && idFromQuery[1]) return idFromQuery[1];

  const idFromPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idFromPath && idFromPath[1]) return idFromPath[1];

  return "";
}

export function isLikelyDriveFileId(value) {
  const clean = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{20,}$/.test(clean);
}

export function extractDriveResourceKey(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  const keyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9._-]+)/i);
  return (keyMatch && keyMatch[1]) || "";
}
