import { cleanPhotoArray, normalizeBoolean, normalizeCountString, normalizePositiveNumberString } from "./utils.js";
import { normalizeGalleryMode, normalizeGalleryPhotoFocusMap, normalizeGalleryStyle } from "./schema/gallery.js";
import { normalizeGiftAccounts } from "./schema/gift.js";
import { normalizeMusicPlaybackMode, normalizeMusicPlaylist } from "./schema/music.js";

export function normalizeThemeName(value) {
  const theme = String(value || "").trim().toLowerCase();
  return ["botanical", "rose", "royal", "minimal"].includes(theme) ? theme : "botanical";
}

export function createInitialWeddingConfig(defaultConfig = {}) {
  return {
    ...defaultConfig,
    invitationBaseUrl: String(defaultConfig.invitationBaseUrl || "").trim(),
    themeName: normalizeThemeName(defaultConfig.themeName),
    akad: { ...(defaultConfig.akad || {}) },
    resepsi: { ...(defaultConfig.resepsi || {}) },
    loveStoryPhotos: cleanPhotoArray(defaultConfig.loveStoryPhotos),
    loveStoryItems: Array.isArray(defaultConfig.loveStoryItems) ? [...defaultConfig.loveStoryItems] : [],
    galleryPhotos: cleanPhotoArray(defaultConfig.galleryPhotos),
    galleryPhotoFocus: normalizeGalleryPhotoFocusMap(defaultConfig.galleryPhotoFocus || {}),
    eventStartISO: String(defaultConfig.eventStartISO || defaultConfig.weddingDateISO || "").trim(),
    backgroundMusicUrl: String(defaultConfig.backgroundMusicUrl || "").trim(),
    musicPlaybackMode: normalizeMusicPlaybackMode(defaultConfig.musicPlaybackMode || "ordered"),
    musicPlaylist: normalizeMusicPlaylist(defaultConfig.musicPlaylist, defaultConfig.backgroundMusicUrl),
    giftEnabled: normalizeBoolean(defaultConfig.giftEnabled, false),
    giftSectionTitle: String(defaultConfig.giftSectionTitle || "Wedding Gift"),
    giftSectionSubtitle: String(defaultConfig.giftSectionSubtitle || ""),
    giftAccounts: normalizeGiftAccounts(defaultConfig.giftAccounts)
  };
}

export function healMisplacedPhotoConfig(config, defaultConfig = {}) {
  const fallbackStory = cleanPhotoArray(defaultConfig.loveStoryPhotos).slice(0, 3);
  const source = (config && typeof config === "object") ? config : {};
  const loveStory = cleanPhotoArray(source.loveStoryPhotos);
  const gallery = cleanPhotoArray(source.galleryPhotos);

  if (!(gallery.length === 0 && loveStory.length > 3)) {
    return source;
  }

  return {
    ...source,
    loveStoryPhotos: fallbackStory.length ? fallbackStory : loveStory.slice(0, 3),
    galleryPhotos: loveStory
  };
}

export function mergeWeddingConfig(baseConfig = {}, incomingConfig = {}, defaultConfig = {}) {
  if (!incomingConfig || typeof incomingConfig !== "object") return baseConfig;

  const incomingMusicUrl = String(incomingConfig.backgroundMusicUrl || "").trim();
  const baseMusicUrl = String(baseConfig.backgroundMusicUrl || "").trim();
  const incomingMusicPlaylist = incomingConfig.musicPlaylist !== undefined
    ? incomingConfig.musicPlaylist
    : (baseConfig.musicPlaylist !== undefined ? baseConfig.musicPlaylist : defaultConfig.musicPlaylist);
  const merged = {
    ...baseConfig,
    ...incomingConfig,
    invitationBaseUrl: String(incomingConfig.invitationBaseUrl || baseConfig.invitationBaseUrl || defaultConfig.invitationBaseUrl || "").trim(),
    themeName: normalizeThemeName(incomingConfig.themeName || baseConfig.themeName || defaultConfig.themeName),
    backgroundMusicUrl: incomingMusicUrl || baseMusicUrl,
    musicPlaybackMode: normalizeMusicPlaybackMode(
      incomingConfig.musicPlaybackMode || baseConfig.musicPlaybackMode || defaultConfig.musicPlaybackMode || "ordered"
    ),
    musicPlaylist: normalizeMusicPlaylist(
      incomingMusicPlaylist,
      incomingMusicUrl || baseMusicUrl || defaultConfig.backgroundMusicUrl
    ),
    akad: {
      ...(baseConfig.akad || {}),
      ...(incomingConfig.akad || {})
    },
    resepsi: {
      ...(baseConfig.resepsi || {}),
      ...(incomingConfig.resepsi || {})
    },
    loveStoryPhotos: Array.isArray(incomingConfig.loveStoryPhotos) && incomingConfig.loveStoryPhotos.length
      ? incomingConfig.loveStoryPhotos
      : baseConfig.loveStoryPhotos,
    loveStoryItems: Array.isArray(incomingConfig.loveStoryItems) && incomingConfig.loveStoryItems.length
      ? incomingConfig.loveStoryItems
      : baseConfig.loveStoryItems,
    galleryPhotos: Array.isArray(incomingConfig.galleryPhotos) && incomingConfig.galleryPhotos.length
      ? incomingConfig.galleryPhotos
      : baseConfig.galleryPhotos,
    galleryPhotoFocus: normalizeGalleryPhotoFocusMap(
      incomingConfig.galleryPhotoFocus || baseConfig.galleryPhotoFocus || defaultConfig.galleryPhotoFocus || {}
    ),
    eventStartISO: String(
      incomingConfig.eventStartISO ||
      baseConfig.eventStartISO ||
      defaultConfig.eventStartISO ||
      incomingConfig.weddingDateISO ||
      baseConfig.weddingDateISO ||
      defaultConfig.weddingDateISO ||
      ""
    ).trim(),
    giftEnabled: normalizeBoolean(
      (incomingConfig.giftEnabled !== undefined ? incomingConfig.giftEnabled : baseConfig.giftEnabled),
      normalizeBoolean(defaultConfig.giftEnabled, false)
    ),
    giftSectionTitle: String(incomingConfig.giftSectionTitle || baseConfig.giftSectionTitle || defaultConfig.giftSectionTitle || "Wedding Gift").trim(),
    giftSectionSubtitle: String(incomingConfig.giftSectionSubtitle || baseConfig.giftSectionSubtitle || defaultConfig.giftSectionSubtitle || "").trim(),
    giftAccounts: normalizeGiftAccounts(
      incomingConfig.giftAccounts !== undefined
        ? incomingConfig.giftAccounts
        : (baseConfig.giftAccounts !== undefined ? baseConfig.giftAccounts : defaultConfig.giftAccounts)
    )
  };

  merged.galleryMode = normalizeGalleryMode(incomingConfig.galleryMode || baseConfig.galleryMode || defaultConfig.galleryMode);
  merged.galleryStyle = normalizeGalleryStyle(incomingConfig.galleryStyle || baseConfig.galleryStyle || defaultConfig.galleryStyle);
  merged.galleryMaxItems = normalizeCountString(incomingConfig.galleryMaxItems || baseConfig.galleryMaxItems || defaultConfig.galleryMaxItems);
  merged.galleryAutoplaySec = normalizePositiveNumberString(
    incomingConfig.galleryAutoplaySec || baseConfig.galleryAutoplaySec || defaultConfig.galleryAutoplaySec
  );

  merged.quranVerseArabic = String(merged.quranVerseArabic || "").trim() || String(baseConfig.quranVerseArabic || "").trim();
  merged.quranVerseTranslation = String(merged.quranVerseTranslation || "").trim() || String(baseConfig.quranVerseTranslation || "").trim();
  merged.quranVerseReference = String(merged.quranVerseReference || "").trim() || String(baseConfig.quranVerseReference || "").trim();
  merged.hadithText = String(merged.hadithText || "").trim() || String(baseConfig.hadithText || "").trim();
  merged.hadithReference = String(merged.hadithReference || "").trim() || String(baseConfig.hadithReference || "").trim();
  merged.marriageDoaText = String(merged.marriageDoaText || "").trim() || String(baseConfig.marriageDoaText || "").trim();
  merged.marriageDoaReference = String(merged.marriageDoaReference || "").trim() || String(baseConfig.marriageDoaReference || "").trim();

  return merged;
}
