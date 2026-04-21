export function setMetaDescription(content) {
  const text = String(content || "").trim();
  if (!text) return;

  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", text);
}
