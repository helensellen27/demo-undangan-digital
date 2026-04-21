const MUSIC_PROXY_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

function extractDriveFileId(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  const idFromQuery = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idFromQuery && idFromQuery[1]) return idFromQuery[1];

  const idFromPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idFromPath && idFromPath[1]) return idFromPath[1];

  return "";
}

function extractDriveResourceKey(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  const keyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9._-]+)/i);
  return (keyMatch && keyMatch[1]) || "";
}

function buildCandidateUrls(fileId, resourceKey, sourceUrl) {
  const encodedKey = resourceKey ? encodeURIComponent(resourceKey) : "";
  const keySuffix = encodedKey ? `&resourcekey=${encodedKey}` : "";
  const candidates = [];

  const cleanSourceUrl = String(sourceUrl || "").trim();
  if (cleanSourceUrl) candidates.push(cleanSourceUrl);

  if (fileId) {
    candidates.push(`https://docs.google.com/uc?export=download&id=${fileId}${keySuffix}`);
    candidates.push(`https://drive.google.com/uc?export=download&id=${fileId}${keySuffix}`);
    candidates.push(`https://drive.google.com/uc?export=view&id=${fileId}${keySuffix}`);
    candidates.push(`https://drive.usercontent.google.com/download?id=${fileId}&export=download${keySuffix}`);
  }

  return candidates.filter(Boolean);
}

async function fetchFirstPlayable(candidates, req) {
  const rangeHeader = req.headers.range;

  for (const candidate of candidates) {
    try {
      const upstream = await fetch(candidate, {
        method: req.method === "HEAD" ? "HEAD" : "GET",
        headers: {
          ...(rangeHeader ? { Range: rangeHeader } : {}),
          "User-Agent": "Mozilla/5.0 Codex Music Proxy",
          Accept: "audio/*,*/*;q=0.8"
        },
        redirect: "follow"
      });

      if (!upstream.ok && upstream.status !== 206) {
        continue;
      }

      const contentType = String(upstream.headers.get("content-type") || "").toLowerCase();
      const disposition = String(upstream.headers.get("content-disposition") || "").toLowerCase();
      const looksPlayable =
        contentType.startsWith("audio/") ||
        disposition.includes(".mp3") ||
        disposition.includes(".m4a") ||
        disposition.includes(".wav") ||
        disposition.includes(".ogg");

      if (!looksPlayable) {
        continue;
      }

      return upstream;
    } catch (error) {
      // Try the next candidate URL.
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "")) {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  const sourceUrl = String((req.query && req.query.src) || "").trim();
  const fileId = String((req.query && req.query.fileId) || "").trim() || extractDriveFileId(sourceUrl);
  const resourceKey = String((req.query && req.query.resourceKey) || "").trim() || extractDriveResourceKey(sourceUrl);
  const candidates = buildCandidateUrls(fileId, resourceKey, sourceUrl);

  if (!candidates.length) {
    res.status(400).json({ success: false, message: "Missing music source" });
    return;
  }

  const upstream = await fetchFirstPlayable(candidates, req);
  if (!upstream) {
    res.status(502).json({ success: false, message: "Music source is not playable" });
    return;
  }

  const passHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified"
  ];

  passHeaders.forEach((headerName) => {
    const value = upstream.headers.get(headerName);
    if (value) res.setHeader(headerName, value);
  });

  res.setHeader("Cache-Control", MUSIC_PROXY_CACHE_CONTROL);
  res.status(upstream.status);

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  const arrayBuffer = await upstream.arrayBuffer();
  res.send(Buffer.from(arrayBuffer));
}
