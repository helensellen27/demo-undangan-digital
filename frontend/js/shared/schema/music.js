import { normalizeBoolean, parseJsonValue } from "../utils.js";
import { extractDriveFileId, isLikelyDriveFileId } from "../drive.js";

export function normalizeMusicPlaybackMode(value) {
  return String(value || "").trim().toLowerCase() === "shuffle" ? "shuffle" : "ordered";
}

export function normalizeMusicTrack(item, index = 0, options = {}) {
  const source = (item && typeof item === "object") ? item : {};
  const sourceUrl = String(
    source.url ||
    source.audioStreamUrl ||
    source.downloadUrl ||
    source.publicUrl ||
    source.webUrl ||
    ""
  ).trim();
  const buildUrl = typeof options.buildUrl === "function" ? options.buildUrl : null;
  const url = (buildUrl && buildUrl(source)) || sourceUrl;
  const fallbackId = options.idPrefix ? `${options.idPrefix}-${index + 1}` : `track-${index + 1}`;
  const id = String(source.id || source.fileId || source.trackId || fallbackId).trim() || fallbackId;
  const fallbackTitle = sourceUrl ? sourceUrl.split("/").pop() : `Track ${index + 1}`;

  return {
    id,
    title: String(source.title || source.name || fallbackTitle || `Track ${index + 1}`).trim(),
    url,
    sourceUrl,
    isActive: source.isActive === undefined ? true : normalizeBoolean(source.isActive, true)
  };
}

export function normalizeMusicPlaylist(input, fallbackUrl = "", options = {}) {
  const source = parseJsonValue(input, []);
  let tracks = Array.isArray(source)
    ? source
      .map((item, index) => normalizeMusicTrack(item, index, options))
      .filter((item) => item.url || item.sourceUrl)
    : [];

  const hasRealDriveTrack = tracks.some((item) => isLikelyDriveFileId(item.id) || extractDriveFileId(item.sourceUrl || item.url));
  if (hasRealDriveTrack) {
    tracks = tracks.filter((item) => item.id !== "default-track-1" && item.id !== "legacy-track-1");
  }

  if (!tracks.length && fallbackUrl) {
    tracks = [normalizeMusicTrack({
      id: "legacy-track-1",
      title: "Musik Utama",
      url: fallbackUrl,
      isActive: true
    }, 0, options)];
  }

  return tracks;
}

export function getActiveMusicTracks(config, options = {}) {
  const playlist = normalizeMusicPlaylist(config && config.musicPlaylist, config && config.backgroundMusicUrl, options);
  const active = playlist.filter((item) => item.isActive && item.url);
  return active.length ? active : playlist.filter((item) => item.url);
}
