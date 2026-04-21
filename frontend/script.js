import { setMetaDescription as updateMetaDescription } from "./js/shared/meta.js";
import { createInitialWeddingConfig, healMisplacedPhotoConfig as sharedHealMisplacedPhotoConfig, mergeWeddingConfig, normalizeThemeName as sharedNormalizeThemeName } from "./js/shared/config-normalizer.js";
import { BANK_CATALOG, findProviderByName } from "./js/shared/catalogs.js";
import { extractDriveFileId as sharedExtractDriveFileId, isLikelyDriveFileId as sharedIsLikelyDriveFileId } from "./js/shared/drive.js";
import { cleanPhotoArray as sharedCleanPhotoArray, clampPercent as sharedClampPercent, normalizeBoolean as sharedNormalizeBoolean, normalizeCountString as sharedNormalizeCountString, normalizePositiveNumberString as sharedNormalizePositiveNumberString } from "./js/shared/utils.js";
import { normalizeGalleryMode as sharedNormalizeGalleryMode, normalizeGalleryPhotoFocusMap as sharedNormalizeGalleryPhotoFocusMap, normalizeGalleryStyle as sharedNormalizeGalleryStyle } from "./js/shared/schema/gallery.js";
import { getGiftProviderCode as sharedGetGiftProviderCode, getGiftProviderMeta as sharedGetGiftProviderMeta, getGiftProviderName as sharedGetGiftProviderName, inferGiftAccountType as sharedInferGiftAccountType, normalizeGiftAccounts as sharedNormalizeGiftAccounts, normalizeGiftType as sharedNormalizeGiftType } from "./js/shared/schema/gift.js";
import { getActiveMusicTracks as sharedGetActiveMusicTracks, normalizeMusicPlaybackMode as sharedNormalizeMusicPlaybackMode, normalizeMusicPlaylist as sharedNormalizeMusicPlaylist, normalizeMusicTrack as sharedNormalizeMusicTrack } from "./js/shared/schema/music.js";
import { createPublicConfigRuntime } from "./js/public/config.js";
import { createGalleryController } from "./js/public/gallery.js";
import { createMusicController } from "./js/public/music.js";

let RSVP_API_URL = window.RSVP_API_URL || "";
const WEDDING_CONFIG = window.WEDDING_CONFIG || {};
let PUBLIC_CONFIG_MODE = window.PUBLIC_CONFIG_MODE || "server";

const form = document.getElementById("rsvpForm");
const statusText = document.getElementById("formStatus");
const inputNama = document.getElementById("inputNama");
const rsvpNameLabel = document.getElementById("rsvpNameLabel");
const rsvpCountLabel = document.getElementById("rsvpCountLabel");
const rsvpModeHint = document.getElementById("rsvpModeHint");
const submitRsvpBtn = form ? form.querySelector("button[type='submit']") : null;
const galleryGrid = document.getElementById("galleryGrid");
const wishesList = document.getElementById("wishesList");
const wishesMeta = document.getElementById("wishesMeta");
const wishesToggle = document.getElementById("wishesToggle");
const resepsiMapEmbed = document.getElementById("resepsiMapEmbed");

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");
const countdownNodes = [cdDays, cdHours, cdMinutes, cdSeconds];

const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const textureLayer = document.querySelector(".texture");
const auraLeft = document.querySelector(".aura-left");
const auraRight = document.querySelector(".aura-right");
const leafLayer = document.getElementById("leafLayer");
const flowerLayer = document.getElementById("flowerLayer");
const heroCloudPhoto = document.getElementById("heroCloudPhoto");
const pageLoader = document.getElementById("pageLoader");
const loaderText = document.getElementById("loaderText");
const loaderRetry = document.getElementById("loaderRetry");
const invitationGate = document.getElementById("invitationGate");
const openInvitationBtn = document.getElementById("openInvitationBtn");
const gateNames = document.getElementById("gateNames");
const gateDatePlace = document.getElementById("gateDatePlace");
const gateGuestName = document.getElementById("gateGuestName");
const addToCalendarLink = document.getElementById("addToCalendarLink");
const giftSection = document.getElementById("giftSection");
const giftSectionTitle = document.getElementById("giftSectionTitle");
const giftSectionSubtitle = document.getElementById("giftSectionSubtitle");
const giftCategoryTabs = document.getElementById("giftCategoryTabs");
const giftAccountsList = document.getElementById("giftAccountsList");

const lightbox = document.createElement("div");
lightbox.className = "gallery-lightbox";
lightbox.setAttribute("aria-hidden", "true");
lightbox.innerHTML = `
  <button type="button" class="gallery-lightbox-close" aria-label="Tutup foto">&times;</button>
  <img class="gallery-lightbox-image" alt="Foto galeri ukuran besar" />
`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector(".gallery-lightbox-image");
const lightboxCloseBtn = lightbox.querySelector(".gallery-lightbox-close");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;
const isLowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isSmallScreen;
const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
const isSmallMobileViewport = window.matchMedia("(max-width: 520px)").matches;

const particleState = {
  leafTimer: null,
  flowerTimer: null,
  countdownTimer: null,
  maxLeaves: isSmallMobileViewport ? 4 : (isLowPowerDevice ? 8 : 18),
  maxFlowers: isSmallMobileViewport ? 3 : (isLowPowerDevice ? 6 : 14)
};
const musicState = {
  startSec: 0,
  loopStartSec: null,
  loopEndSec: null,
  activeTracks: [],
  currentTrackIndex: 0,
  playbackMode: "ordered"
};
const giftUiState = {
  activeCategory: "",
  isExpanded: false
};
const galleryState = {
  autoplayTimer: null
};
let attemptMusicStartFromGesture = async () => false;
let wishesAutoScrollTimer = null;
let wishesAutoPauseUntil = 0;
let wishesRefreshTimer = null;
let themeMotionFrame = null;
let themeMotionSetupDone = false;
let revealAnimationSetupDone = false;
let musicControlSetupDone = false;
let visibilityOptimizationSetupDone = false;
let invitationGateSetupDone = false;
let pageContentApplied = false;

let currentConfig = createInitialWeddingConfig(WEDDING_CONFIG);
const CONFIG_CACHE_KEY = "wedding_config_cache_v2";
const CONFIG_CACHE_TTL_MS = 1000 * 30;
const ADMIN_PREVIEW_DRAFT_KEY = "wedding_admin_preview_draft_v1";
const elementCache = new Map();
const publicConfigRuntime = createPublicConfigRuntime({
  cacheKey: CONFIG_CACHE_KEY,
  cacheTtlMs: CONFIG_CACHE_TTL_MS
});
const galleryController = createGalleryController({
  galleryGrid,
  lightbox,
  lightboxImg,
  galleryState,
  isMobileViewport,
  weddingConfig: WEDDING_CONFIG,
  getCurrentConfig: () => currentConfig,
  normalizeCountString,
  normalizeGalleryMode,
  normalizeGalleryStyle,
  normalizePositiveNumberString,
  getGalleryObjectPosition,
  extractDriveFileId
});
const musicController = createMusicController({
  musicToggle,
  bgMusic,
  musicState,
  weddingConfig: WEDDING_CONFIG,
  getCurrentConfig: () => currentConfig,
  getActiveMusicTracks,
  normalizeMusicPlaybackMode,
  extractDriveFileId,
  extractDriveResourceKey,
  isLikelyDriveFileId
});

function cleanPhotoArray(input) {
  return sharedCleanPhotoArray(input);
}

function normalizeMusicPlaybackMode(value) {
  return sharedNormalizeMusicPlaybackMode(value);
}

function isLikelyDriveFileId(value) {
  return sharedIsLikelyDriveFileId(value);
}

function normalizeMusicTrack(item, index = 0) {
  return sharedNormalizeMusicTrack(item, index);
}

function normalizeMusicPlaylist(input, fallbackUrl = "") {
  return sharedNormalizeMusicPlaylist(input, fallbackUrl);
}

function getActiveMusicTracks(config) {
  return sharedGetActiveMusicTracks(config);
}

function healMisplacedPhotoConfig(config) {
  return sharedHealMisplacedPhotoConfig(config, WEDDING_CONFIG);
}

function getCachedElement(id) {
  if (!elementCache.has(id)) {
    elementCache.set(id, document.getElementById(id));
  }
  return elementCache.get(id);
}

function setText(id, value) {
  const el = getCachedElement(id);
  if (!el) return;
  el.textContent = String(value || "");
}

function setBrandMonogram(value) {
  const el = getCachedElement("brandInitials");
  if (!el) return;

  const raw = String(value || "").trim();
  if (!raw) {
    el.textContent = "";
    return;
  }

  const cleaned = raw.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/&|dan|\+/i).map((item) => item.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const left = parts[0].charAt(0).toUpperCase();
    const right = parts[1].charAt(0).toUpperCase();
    el.innerHTML = `<span class="brand-letter">${left}</span><span class="brand-sep">&amp;</span><span class="brand-letter">${right}</span>`;
    el.setAttribute("aria-label", cleaned);
    return;
  }

  el.textContent = cleaned;
  el.setAttribute("aria-label", cleaned);
}

function setAnimatedName(id, value, baseDelayMs = 0) {
  const el = getCachedElement(id);
  if (!el) return;

  const text = String(value || "").trim();
  if (!text) {
    el.textContent = "";
    return;
  }

  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }

  if (el.dataset.animatedText === text) return;
  el.dataset.animatedText = text;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  el.classList.add("hero-name");

  const fragment = document.createDocumentFragment();
  Array.from(text).forEach((char, idx) => {
    const letter = document.createElement("span");
    letter.className = char === " " ? "char is-space" : "char";
    letter.style.animationDelay = `${(baseDelayMs + (idx * 45)) / 1000}s`;
    letter.textContent = char === " " ? "\u00A0" : char;
    fragment.appendChild(letter);
  });

  el.appendChild(fragment);
}

function setLink(id, value) {
  const el = getCachedElement(id);
  if (el && value) el.href = value;
}

function setInternalAnchorLink(id, hashTarget) {
  const el = getCachedElement(id);
  if (!el) return;
  el.href = hashTarget || "#";
  el.removeAttribute("target");
  el.removeAttribute("rel");
}

function setHtml(id, value) {
  const el = getCachedElement(id);
  if (el && value) el.innerHTML = value;
}

function formatEventDateHtml(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text
    .replace(/\s+-\s+/g, " – ")
    .replace(/(\d{1,2})\s+–\s+(\d{1,2})/g, "$1–$2");
  const commaIndex = normalized.indexOf(",");
  if (commaIndex === -1) return escapeHtml(normalized);

  const dayText = normalized.slice(0, commaIndex).trim();
  const dateText = normalized.slice(commaIndex + 1).trim();
  if (!dayText || !dateText) return escapeHtml(normalized);

  return `
    <span class="event-date-main">${escapeHtml(dateText)}</span>
    <span class="event-date-day">${escapeHtml(dayText)}</span>
  `;
}

function setIframeSrc(id, value) {
  const el = getCachedElement(id);
  if (el && value) el.src = value;
}

function buildEmbedUrl(mapUrl, venue) {
  const cleanMapUrl = (mapUrl || "").trim();
  if (cleanMapUrl.includes("google.com/maps/embed") || cleanMapUrl.includes("output=embed")) {
    return cleanMapUrl;
  }

  const coordMatch = cleanMapUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordMatch && coordMatch[1] && coordMatch[2]) {
    const q = `${coordMatch[1]},${coordMatch[2]}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  }

  const queryFromUrlMatch = cleanMapUrl.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?(?:%2C|,)-?\d+(?:\.\d+)?)/i);
  if (queryFromUrlMatch && queryFromUrlMatch[1]) {
    const q = decodeURIComponent(queryFromUrlMatch[1]);
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  }

  if (cleanMapUrl) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanMapUrl)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  const query = encodeURIComponent((venue || "").trim());
  if (query) {
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  return "https://maps.google.com/maps?q=Indonesia&t=&z=5&ie=UTF8&iwloc=&output=embed";
}

function getGuestNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("to") || params.get("tamu") || params.get("nama");
  if (!raw) return "Bapak/Ibu/Saudara/i";
  return raw.replace(/\+/g, " ").trim() || "Bapak/Ibu/Saudara/i";
}

function getGuestCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("guest") || params.get("guestCode") || params.get("kode") || "").trim();
}

function getGuestInviteTypeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("type") || params.get("inviteType") || "").trim().toLowerCase() === "group"
    ? "group"
    : "personal";
}

function clampPercent(value, fallback = 50) {
  return sharedClampPercent(value, fallback);
}

function normalizeGalleryPhotoFocusMap(input) {
  return sharedNormalizeGalleryPhotoFocusMap(input);
}

function normalizeBoolean(value, fallback = false) {
  return sharedNormalizeBoolean(value, fallback);
}

function normalizeGiftType(value) {
  return sharedNormalizeGiftType(value);
}

function getGiftProviderCode(account) {
  return sharedGetGiftProviderCode(account);
}

function getGiftProviderName(account) {
  return sharedGetGiftProviderName(account);
}

function findGiftProviderByName(catalog, name) {
  return findProviderByName(catalog, name);
}

function inferGiftAccountType(account) {
  return sharedInferGiftAccountType(account);
}

function normalizeGiftAccounts(input) {
  return sharedNormalizeGiftAccounts(input);
}

function getGalleryObjectPosition(photoUrl) {
  const key = String(photoUrl || "").trim();
  const map = normalizeGalleryPhotoFocusMap(currentConfig.galleryPhotoFocus);
  const item = map[key];
  if (!item) return "50% 50%";
  return `${clampPercent(item.x, 50)}% ${clampPercent(item.y, 50)}%`;
}

function mergeConfig(base, incoming) {
  return healMisplacedPhotoConfig(mergeWeddingConfig(base, incoming, WEDDING_CONFIG));
}

function formatStoryDateDisplay(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(value);
  }

  const text = String(value || "").trim();
  if (!text) return "";

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  return text;
}

function cleanStoryDescription(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^InvalidA1\s*:/i.test(text)) {
    return text.replace(/^InvalidA1\s*:\s*/i, "").trim();
  }
  return text;
}

function setMetaDescription(content) {
  updateMetaDescription(content);
}

function normalizeGalleryMode(value) {
  return sharedNormalizeGalleryMode(value);
}

function normalizeGalleryStyle(value) {
  return sharedNormalizeGalleryStyle(value);
}

function normalizeCountString(value) {
  return sharedNormalizeCountString(value);
}

function normalizePositiveNumberString(value) {
  return sharedNormalizePositiveNumberString(value);
}

function normalizeThemeName(value) {
  return sharedNormalizeThemeName(value);
}

function applyThemeName(value) {
  const theme = normalizeThemeName(value);
  document.body.dataset.theme = theme;
  syncThemeMotion(theme);
}

function syncThemeMotion(theme) {
  const normalized = normalizeThemeName(theme);
  const shouldReduceMotion = prefersReducedMotion || isSmallMobileViewport;
  document.body.classList.toggle("theme-motion-off", shouldReduceMotion);

  if (normalized === "minimal") {
    particleState.maxLeaves = isSmallMobileViewport ? 2 : (isLowPowerDevice ? 4 : 8);
    particleState.maxFlowers = isSmallMobileViewport ? 1 : (isLowPowerDevice ? 3 : 6);
  } else if (normalized === "royal") {
    particleState.maxLeaves = isSmallMobileViewport ? 2 : (isLowPowerDevice ? 5 : 10);
    particleState.maxFlowers = isSmallMobileViewport ? 4 : (isLowPowerDevice ? 8 : 16);
  } else if (normalized === "luxury-gold") {
    particleState.maxLeaves = isSmallMobileViewport ? 1 : (isLowPowerDevice ? 3 : 6);
    particleState.maxFlowers = isSmallMobileViewport ? 5 : (isLowPowerDevice ? 10 : 18);
  } else if (normalized === "rose") {
    particleState.maxLeaves = isSmallMobileViewport ? 2 : (isLowPowerDevice ? 5 : 10);
    particleState.maxFlowers = isSmallMobileViewport ? 5 : (isLowPowerDevice ? 10 : 20);
  } else {
    particleState.maxLeaves = isSmallMobileViewport ? 4 : (isLowPowerDevice ? 8 : 18);
    particleState.maxFlowers = isSmallMobileViewport ? 3 : (isLowPowerDevice ? 6 : 14);
  }

  updateThemeParallax();
}

function setMotionVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function updateThemeParallax() {
  if (prefersReducedMotion || isSmallMobileViewport) {
    setMotionVar("--hero-parallax-y", "0px");
    setMotionVar("--hero-title-parallax-y", "0px");
    setMotionVar("--aura-left-y", "0px");
    setMotionVar("--aura-right-y", "0px");
    setMotionVar("--texture-y", "0px");
    return;
  }

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportH = window.innerHeight || 1;
  const heroProgress = Math.min(scrollY / viewportH, 1.35);
  setMotionVar("--hero-parallax-y", `${(heroProgress * 46).toFixed(2)}px`);
  setMotionVar("--hero-title-parallax-y", `${(heroProgress * -14).toFixed(2)}px`);
  setMotionVar("--aura-left-y", `${(scrollY * -0.035).toFixed(2)}px`);
  setMotionVar("--aura-right-y", `${(scrollY * 0.045).toFixed(2)}px`);
  setMotionVar("--texture-y", `${(scrollY * -0.018).toFixed(2)}px`);
}

function scheduleThemeParallax() {
  if (themeMotionFrame) return;
  themeMotionFrame = window.requestAnimationFrame(() => {
    themeMotionFrame = null;
    updateThemeParallax();
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  return publicConfigRuntime.fetchWithTimeout(url, options, timeoutMs);
}

async function hydrateRuntimeConfig() {
  if (window.RUNTIME_CONFIG_PROMISE && typeof window.RUNTIME_CONFIG_PROMISE.then === "function") {
    await window.RUNTIME_CONFIG_PROMISE;
  }
  RSVP_API_URL = window.RSVP_API_URL || RSVP_API_URL;
  PUBLIC_CONFIG_MODE = window.PUBLIC_CONFIG_MODE || PUBLIC_CONFIG_MODE;
}

async function loadServerConfig() {
  if (PUBLIC_CONFIG_MODE === "local") {
    return true;
  }

  const result = await publicConfigRuntime.loadServerConfig({
    currentConfig,
    mergeConfig,
    rsvpApiUrl: RSVP_API_URL,
    preferCachedConfig: true,
    onFreshConfig: applyFreshServerConfig
  });
  currentConfig = result.config;
  const previewDraft = readAdminPreviewDraft();
  if (previewDraft) {
    currentConfig = mergeConfig(currentConfig, previewDraft);
  }
  return result.ok;
}

function applyFreshServerConfig(config) {
  currentConfig = config;
  const previewDraft = readAdminPreviewDraft();
  if (previewDraft) {
    currentConfig = mergeConfig(currentConfig, previewDraft);
  }

  if (!pageContentApplied) return;
  applyWeddingConfig();
  applyGuestName();
  syncWishesMobileState();
  updateCountdown();
}

function readCachedConfig() {
  return publicConfigRuntime.readCachedConfig();
}

function writeCachedConfig(config) {
  publicConfigRuntime.writeCachedConfig(config);
}

function isAdminPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === "admin";
}

function readAdminPreviewDraft() {
  if (!isAdminPreviewMode()) return null;
  try {
    const raw = localStorage.getItem(ADMIN_PREVIEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
}

function setLoaderMessage(message, allowRetry) {
  if (loaderText && message) loaderText.textContent = message;
  if (loaderRetry) loaderRetry.hidden = !allowRetry;
}

function setFormStatus(message, type) {
  if (!statusText) return;
  statusText.textContent = message || "";
  statusText.classList.remove("is-loading", "is-success", "is-error");
  if (type) statusText.classList.add(type);
}

function stopWishesAutoScroll() {
  if (!wishesAutoScrollTimer) return;
  clearInterval(wishesAutoScrollTimer);
  wishesAutoScrollTimer = null;
}

function startWishesAutoScroll() {
  if (!wishesList || prefersReducedMotion) return;
  stopWishesAutoScroll();

  const maxScroll = wishesList.scrollHeight - wishesList.clientHeight;
  if (maxScroll <= 10) return;

  wishesAutoScrollTimer = window.setInterval(() => {
    if (!wishesList || document.hidden) return;
    if (Date.now() < wishesAutoPauseUntil) return;
    if (wishesList.matches(":hover")) return;

    const max = wishesList.scrollHeight - wishesList.clientHeight;
    if (max <= 10) return;

    const next = wishesList.scrollTop + 1;
    wishesList.scrollTop = next >= max ? 0 : next;
  }, 46);
}

function refreshWishesAutoScroll() {
  stopWishesAutoScroll();
  window.setTimeout(startWishesAutoScroll, 380);
}

function scrollToWishesPanel() {
  const target = wishesList ? wishesList.closest(".wishes-panel") : null;
  if (!target) return;
  setWishesCollapsed(false);
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWishTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    return "";
  }
}

function renderWishes(wishes) {
  if (!wishesList) return;

  const rows = Array.isArray(wishes) ? wishes : [];
  if (!rows.length) {
    wishesList.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama mengirim doa terbaik.</p>';
    if (wishesMeta) wishesMeta.textContent = "0 ucapan ditampilkan";
    stopWishesAutoScroll();
    return;
  }

  wishesList.innerHTML = rows.map((wish) => {
    const name = escapeHtml(wish.nama || "Tamu Undangan");
    const ucapan = escapeHtml(wish.ucapan || "-");
    const hadir = String(wish.kehadiran || "").toLowerCase() === "hadir";
    const hadirText = hadir ? "Hadir" : "Tidak Hadir";
    const hadirClass = hadir ? "" : " absent";
    const waktu = formatWishTime(wish.waktu);

    return `
      <article class="wishes-item">
        <div class="wishes-item-head">
          <strong>${name}</strong>
          <span class="wish-presence${hadirClass}">${hadirText}</span>
        </div>
        <p class="wish-text">${ucapan}</p>
        ${waktu ? `<p class="wish-time">${escapeHtml(waktu)}</p>` : ""}
      </article>
    `;
  }).join("");

  if (wishesMeta) wishesMeta.textContent = `${rows.length} ucapan terbaru`;
  refreshWishesAutoScroll();
}

async function loadWishes() {
  if (!wishesList) return;

  if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
    renderWishes([]);
    if (wishesMeta) wishesMeta.textContent = "Sambungkan backend untuk menampilkan ucapan";
    return;
  }

  if (wishesMeta) wishesMeta.textContent = "Memuat ucapan...";

  try {
    const timeouts = [9000, 16000, 26000];
    let result = null;
    let loaded = false;

    for (let i = 0; i < timeouts.length; i += 1) {
      const url = new URL(RSVP_API_URL);
      url.searchParams.set("action", "wishes");
      url.searchParams.set("limit", "8");
      url.searchParams.set("_ts", String(Date.now()));

      try {
        const response = await fetchWithTimeout(url.toString(), { cache: "no-store" }, timeouts[i]);
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat ucapan");
        }
        result = json;
        loaded = true;
        break;
      } catch (error) {
        if (i === timeouts.length - 1) throw error;
      }
    }

    if (loaded) {
      renderWishes((result && result.wishes) || []);
    }
  } catch (error) {
    if (wishesMeta) wishesMeta.textContent = "Ucapan belum bisa dimuat saat ini";
  }
}

function startWishesRefresh() {
  if (wishesRefreshTimer) {
    clearInterval(wishesRefreshTimer);
    wishesRefreshTimer = null;
  }
  wishesRefreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    loadWishes();
  }, 45000);
}

function normalizeGalleryUrl(url, purpose = "gallery") {
  return galleryController.normalizeGalleryUrl(url, purpose);
}

function applyImageWithFallback(img, rawUrl, options = {}) {
  galleryController.applyImageWithFallback(img, rawUrl, options);
}

function clearGalleryAutoplay() {
  galleryController.clearGalleryAutoplay();
}

function openGalleryLightbox(src, index) {
  galleryController.openGalleryLightbox(src, index);
}

function closeGalleryLightbox() {
  galleryController.closeGalleryLightbox();
}

function renderGalleryGrid(photos) {
  galleryController.renderGalleryGrid(photos);
}

function extractDriveFileId(url) {
  return sharedExtractDriveFileId(url);
}

function extractDriveResourceKey(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";
  const keyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9._-]+)/i);
  return (keyMatch && keyMatch[1]) || "";
}

function buildMusicProxyUrl(fileId, resourceKey, sourceUrl) {
  return musicController.buildMusicProxyUrl(fileId, resourceKey, sourceUrl);
}

function normalizeAudioUrl(url) {
  return musicController.normalizeAudioUrl(url);
}

function getAudioSourceCandidates(url) {
  return musicController.getAudioSourceCandidates(url);
}

function applyHeroCloudPhoto() {
  if (!heroCloudPhoto) return;

  const gallerySource = Array.isArray(currentConfig.galleryPhotos) ? currentConfig.galleryPhotos[0] : "";
  const rawSource = String(currentConfig.heroBackgroundPhoto || gallerySource || "assets/photos/foto-1.svg").trim();
  const source = normalizeGalleryUrl(rawSource, "hero");
  if (!source) return;

  const safeUrl = source.replace(/"/g, '\\"');
  heroCloudPhoto.style.backgroundImage = `linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08)), url("${safeUrl}")`;
}

function formatGoogleCalendarDate(ms) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function buildCalendarEndTime(startMs) {
  const resepsiTime = String((currentConfig.resepsi && currentConfig.resepsi.time) || "").trim();
  const rangeMatch = resepsiTime.match(/(\d{1,2})[.:](\d{2})\s*[-\u2013]\s*(\d{1,2})[.:](\d{2})/);
  if (!rangeMatch) return startMs + (2 * 60 * 60 * 1000);

  const startHour = Number(rangeMatch[1]);
  const startMinute = Number(rangeMatch[2]);
  const endHour = Number(rangeMatch[3]);
  const endMinute = Number(rangeMatch[4]);
  const durationMs = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * 60 * 1000;

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return startMs + (2 * 60 * 60 * 1000);
  }

  return startMs + durationMs;
}

function applyCalendarLink() {
  if (!addToCalendarLink) return;

  const startMs = parseWeddingTimestamp();
  if (!Number.isFinite(startMs)) {
    addToCalendarLink.style.display = "none";
    return;
  }

  const endMs = buildCalendarEndTime(startMs);
  const title = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"} - Resepsi Pernikahan`;
  const location = String((currentConfig.resepsi && currentConfig.resepsi.venue) || "").trim();
  const detailParts = [
    "Undangan digital pernikahan.",
    location ? `Lokasi: ${location}` : "",
    String((currentConfig.resepsi && currentConfig.resepsi.mapUrl) || "").trim()
  ].filter(Boolean);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${formatGoogleCalendarDate(startMs)}/${formatGoogleCalendarDate(endMs)}`);
  if (detailParts.length) url.searchParams.set("details", detailParts.join("\n"));
  if (location) url.searchParams.set("location", location);

  addToCalendarLink.href = url.toString();
  addToCalendarLink.style.display = "inline-flex";
}

function getBankMeta(account) {
  const code = getGiftProviderCode(account);
  if (code && BANK_CATALOG[code]) return BANK_CATALOG[code];
  return findGiftProviderByName(BANK_CATALOG, getGiftProviderName(account));
}

function getGiftLogoUrl(account, providerMeta) {
  if (providerMeta && providerMeta.logoUrl) return providerMeta.logoUrl;
  return String(account && account.logoUrl || "").trim();
}

function getGiftAccountCategory(account) {
  return normalizeGiftType(account && account.type || inferGiftAccountType(account));
}

function getGiftProviderMeta(account) {
  return sharedGetGiftProviderMeta(account);
}

function createGiftHead(bankName, logoUrl) {
  const head = document.createElement("div");
  head.className = "gift-bank-brand";

  const bankCodeText = String(bankName || "").trim().slice(0, 6).toUpperCase() || "BANK";
  const fallback = document.createElement("div");
  fallback.className = "gift-bank-fallback";
  fallback.textContent = bankCodeText;
  head.appendChild(fallback);

  if (logoUrl) {
    const logo = document.createElement("img");
    logo.className = "gift-bank-logo";
    logo.alt = `${bankName} logo`;
    logo.loading = "lazy";
    logo.src = logoUrl;
    logo.addEventListener("load", () => {
      fallback.classList.add("is-hidden");
    });
    logo.onerror = () => {
      logo.remove();
      fallback.classList.remove("is-hidden");
    };
    head.insertBefore(logo, fallback);
  }

  const bankText = document.createElement("p");
  bankText.className = "gift-bank-name";
  bankText.textContent = bankName;
  head.appendChild(bankText);

  return head;
}

function renderGiftCategoryTabs(categoryEntries, activeCategory) {
  if (!giftCategoryTabs) return;
  giftCategoryTabs.innerHTML = "";
  giftCategoryTabs.style.display = categoryEntries.length > 1 ? "flex" : (categoryEntries.length === 1 ? "grid" : "none");

  categoryEntries.forEach(([key, items]) => {
    if (!items.length) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gift-category-tab";
    const isActive = key === activeCategory && giftUiState.isExpanded;
    if (isActive) button.classList.add("is-active");
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.setAttribute("aria-expanded", isActive ? "true" : "false");
    button.textContent = key === "ewallet" ? "E-Wallet" : "Transfer Bank";

    const chevron = document.createElement("span");
    chevron.className = "gift-category-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▾";
    button.appendChild(chevron);

    button.addEventListener("click", () => {
      if (giftUiState.activeCategory === key) {
        giftUiState.isExpanded = !giftUiState.isExpanded;
      } else {
        giftUiState.activeCategory = key;
        giftUiState.isExpanded = true;
      }
      renderGiftSection();
    });
    giftCategoryTabs.appendChild(button);
  });
}

function renderGiftSection() {
  if (!giftSection || !giftAccountsList) return;

  const enabled = normalizeBoolean(currentConfig.giftEnabled, false);
  const accounts = normalizeGiftAccounts(currentConfig.giftAccounts).filter((item) => item.isActive);
  if (!enabled || !accounts.length) {
    giftSection.style.display = "none";
    if (giftCategoryTabs) giftCategoryTabs.innerHTML = "";
    return;
  }

  giftSection.style.display = "";
  let sectionTitleText = String(currentConfig.giftSectionTitle || "Wedding Gift").trim() || "Wedding Gift";
  let sectionSubtitleText = String(currentConfig.giftSectionSubtitle || "").trim();
  if (sectionTitleText.length > 60 && !sectionSubtitleText) {
    sectionSubtitleText = sectionTitleText;
    sectionTitleText = "Wedding Gift";
  }

  if (giftSectionTitle) {
    giftSectionTitle.textContent = sectionTitleText;
  }
  if (giftSectionSubtitle) {
    giftSectionSubtitle.textContent = (sectionSubtitleText || "Doa restu Anda adalah hadiah terindah. Jika berkenan, Anda dapat mengirimkan tanda kasih melalui metode berikut.")
      .replace(/melalui rekening berikut\.?/i, "melalui metode berikut.");
  }

  const groupedAccounts = {
    bank: accounts.filter((account) => getGiftAccountCategory(account) === "bank"),
    ewallet: accounts.filter((account) => getGiftAccountCategory(account) === "ewallet")
  };
  const categoryEntries = Object.entries(groupedAccounts).filter(([, items]) => items.length);
  const defaultCategory = categoryEntries[0] ? categoryEntries[0][0] : "";
  const activeCategory = groupedAccounts[giftUiState.activeCategory] && groupedAccounts[giftUiState.activeCategory].length
    ? giftUiState.activeCategory
    : defaultCategory;
  giftUiState.activeCategory = activeCategory;
  renderGiftCategoryTabs(categoryEntries, activeCategory);

  giftAccountsList.innerHTML = "";
  giftAccountsList.classList.toggle("is-hidden", !giftUiState.isExpanded);
  if (!giftUiState.isExpanded) return;
  const categoryHint = document.createElement("p");
  categoryHint.className = "gift-category-hint";
  categoryHint.textContent = activeCategory === "ewallet" ? "Nomor e-wallet" : "Rekening bank";
  giftAccountsList.appendChild(categoryHint);

  giftAccountsList.classList.toggle("is-single", (groupedAccounts[activeCategory] || []).length === 1);
  (groupedAccounts[activeCategory] || []).forEach((account) => {
    const category = getGiftAccountCategory(account);
    const providerMeta = getGiftProviderMeta(account) || (category === "bank" ? getBankMeta(account) : null);
    const providerName = String(account.providerName || (providerMeta && providerMeta.name) || (category === "ewallet" ? "E-Wallet" : "Bank")).trim();
    const logoUrl = getGiftLogoUrl(account, providerMeta);
    const card = document.createElement("article");
    card.className = "gift-account-card";

    const head = createGiftHead(providerName, logoUrl);

    const body = document.createElement("div");
    body.className = "gift-account-body";

    const holder = document.createElement("p");
    holder.className = "gift-account-holder";
    holder.textContent = account.accountHolder ? `a/n ${account.accountHolder}` : "-";

    const accountNumber = document.createElement("p");
    accountNumber.className = "gift-account-number";
    accountNumber.textContent = account.accountNumber;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "gift-copy-btn";
    copyBtn.textContent = category === "ewallet" ? "Salin Nomor" : "Salin Rekening";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(account.accountNumber);
        copyBtn.textContent = "Tersalin";
        window.setTimeout(() => {
          copyBtn.textContent = category === "ewallet" ? "Salin Nomor" : "Salin Rekening";
        }, 1200);
      } catch (error) {
        copyBtn.textContent = "Gagal Salin";
        window.setTimeout(() => {
          copyBtn.textContent = category === "ewallet" ? "Salin Nomor" : "Salin Rekening";
        }, 1400);
      }
    });

    body.appendChild(head);
    body.appendChild(holder);
    body.appendChild(accountNumber);
    body.appendChild(copyBtn);
    card.appendChild(body);
    giftAccountsList.appendChild(card);
  });
}

function applyWeddingConfig() {
  applyThemeName(currentConfig.themeName);
  setBrandMonogram(currentConfig.brandInitials);
  setText("heroOverline", currentConfig.heroOverline || "Wedding Invitation");
  setAnimatedName("heroBrideShort", currentConfig.brideShortName, 140);
  setAnimatedName("heroGroomShort", currentConfig.groomShortName, 420);
  setText("heroDatePlace", currentConfig.heroDatePlace);
  setText("gateNames", `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`);
  setText("gateDatePlace", currentConfig.heroDatePlace);

  setText("avatarBride", (currentConfig.brideShortName || "A").charAt(0).toUpperCase());
  setText("avatarGroom", (currentConfig.groomShortName || "F").charAt(0).toUpperCase());

  setText("brideFullName", currentConfig.brideFullName);
  setText("groomFullName", currentConfig.groomFullName);
  setText("brideParents", currentConfig.brideParents);
  setText("groomParents", currentConfig.groomParents);
  setText("footerNames", currentConfig.footerNames);

  setHtml("quranAyatArab", currentConfig.quranVerseArabic);
  setText("quranAyatTrans", currentConfig.quranVerseTranslation);
  setText("quranAyatRef", currentConfig.quranVerseReference);
  setText("hadithText", currentConfig.hadithText);
  setText("hadithReference", currentConfig.hadithReference);
  setText("marriageDoaText", currentConfig.marriageDoaText);
  setText("marriageDoaReference", currentConfig.marriageDoaReference);

  const quranBlock = document.getElementById("quranBlock");
  const hadithBlock = document.getElementById("hadithBlock");
  const doaBlock = document.getElementById("doaBlock");

  const hasQuran = Boolean(
    String(currentConfig.quranVerseArabic || "").trim() ||
    String(currentConfig.quranVerseTranslation || "").trim() ||
    String(currentConfig.quranVerseReference || "").trim()
  );
  const hasHadith = Boolean(
    String(currentConfig.hadithText || "").trim() ||
    String(currentConfig.hadithReference || "").trim()
  );
  const hasDoa = Boolean(
    String(currentConfig.marriageDoaText || "").trim() ||
    String(currentConfig.marriageDoaReference || "").trim()
  );

  if (quranBlock) quranBlock.style.display = hasQuran ? "" : "none";
  if (hadithBlock) hadithBlock.style.display = hasHadith ? "" : "none";
  if (doaBlock) doaBlock.style.display = hasDoa ? "" : "none";

  const activeTracks = getActiveMusicTracks(currentConfig);
  const firstTrack = activeTracks[0];
  const resolvedMusicUrl = firstTrack ? normalizeAudioUrl(firstTrack.url) : "";
  if (resolvedMusicUrl && bgMusic) {
    bgMusic.src = resolvedMusicUrl;
  }

  const akadCard = document.getElementById("akadCard");
  const resepsiCard = document.getElementById("resepsiCard");
  const eventGrid = document.querySelector(".event-grid");

  if (currentConfig.akad) {
    setHtml("akadDate", formatEventDateHtml(currentConfig.akad.date));
    setText("akadTime", currentConfig.akad.time);
    setText("akadVenue", currentConfig.akad.venue);
    setLink("akadMap", currentConfig.akad.mapUrl);
    setLink("akadMapOpen", currentConfig.akad.mapUrl);
    setIframeSrc("akadMapEmbed", buildEmbedUrl(currentConfig.akad.mapUrl, currentConfig.akad.venue));

    const hasAkadValue = Boolean(
      String(currentConfig.akad.date || "").trim() ||
      String(currentConfig.akad.time || "").trim() ||
      String(currentConfig.akad.venue || "").trim()
    );
    if (akadCard) akadCard.classList.toggle("is-hidden", !hasAkadValue);
  } else if (akadCard) {
    akadCard.classList.add("is-hidden");
  }

  if (currentConfig.resepsi) {
    setHtml("resepsiDate", formatEventDateHtml(currentConfig.resepsi.date));
    setText("resepsiTime", currentConfig.resepsi.time);
    setText("resepsiVenue", currentConfig.resepsi.venue);
    setInternalAnchorLink("resepsiMap", "#peta");
    setLink("resepsiMapOpen", currentConfig.resepsi.mapUrl);
    setIframeSrc("resepsiMapEmbed", buildEmbedUrl(currentConfig.resepsi.mapUrl, currentConfig.resepsi.venue));

    const hasResepsiValue = Boolean(
      String(currentConfig.resepsi.date || "").trim() ||
      String(currentConfig.resepsi.time || "").trim() ||
      String(currentConfig.resepsi.venue || "").trim()
    );
    if (resepsiCard) resepsiCard.classList.toggle("is-hidden", !hasResepsiValue);
  } else if (resepsiCard) {
    resepsiCard.classList.add("is-hidden");
  }

  if (eventGrid) {
    const visibleEventCount = [akadCard, resepsiCard].filter((card) => card && !card.classList.contains("is-hidden")).length;
    eventGrid.classList.toggle("is-single", visibleEventCount === 1);
    eventGrid.classList.toggle("is-duo", visibleEventCount >= 2);
  }

  renderGalleryGrid(currentConfig.galleryPhotos);
  renderGiftSection();

  const storyItems = Array.isArray(currentConfig.loveStoryItems) && currentConfig.loveStoryItems.length
    ? currentConfig.loveStoryItems
    : (Array.isArray(WEDDING_CONFIG.loveStoryItems) ? WEDDING_CONFIG.loveStoryItems : []);
  storyItems.slice(0, 3).forEach((item, index) => {
    const i = index + 1;
    const storyPhoto = String((item && item.photo) || (currentConfig.loveStoryPhotos && currentConfig.loveStoryPhotos[index]) || "").trim();
    const img = document.getElementById(`storyPhoto${i}`);
    applyImageWithFallback(img, storyPhoto, {
      purpose: "story",
      fallbackSrc: `assets/photos/foto-${i}.svg`
    });
    setText(`storyYear${i}`, formatStoryDateDisplay(item && item.date));
    setText(`storyTitle${i}`, item && item.title);
    setText(`storyDesc${i}`, cleanStoryDescription(item && item.description));
  });

  applyHeroCloudPhoto();
  applyCalendarLink();

  const titleNames = `${currentConfig.brideShortName || "Mempelai"} & ${currentConfig.groomShortName || "Mempelai"}`;
  const seoTitle = String(currentConfig.seoTitle || "").trim();
  const seoDescription = String(currentConfig.seoDescription || "").trim();
  document.title = seoTitle || `Undangan Pernikahan | ${titleNames}`;
  setMetaDescription(seoDescription || "Undangan pernikahan digital dengan RSVP online.");
}

function setupInvitationGate() {
  if (!invitationGate || !openInvitationBtn) {
    document.body.classList.remove("invitation-locked");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("open") === "1" || isAdminPreviewMode()) {
    document.body.classList.remove("invitation-locked");
    invitationGate.setAttribute("aria-hidden", "true");
    return;
  }

  if (invitationGateSetupDone) return;
  invitationGateSetupDone = true;

  openInvitationBtn.addEventListener("click", () => {
    attemptMusicStartFromGesture().catch(() => {});
    invitationGate.classList.add("is-opening");
    openInvitationBtn.disabled = true;

    window.setTimeout(() => {
      document.body.classList.remove("invitation-locked");
      invitationGate.setAttribute("aria-hidden", "true");
      invitationGate.classList.remove("is-opening");
      openInvitationBtn.disabled = false;
    }, 620);
  });
}

function applyGuestName() {
  const guestName = getGuestNameFromUrl();
  const inviteType = getGuestInviteTypeFromUrl();
  setText("guestName", guestName);
  setText("gateGuestName", guestName);
  if (rsvpNameLabel) {
    rsvpNameLabel.textContent = inviteType === "group" ? "Nama Anda" : "Nama Tamu";
  }
  if (rsvpCountLabel) {
    rsvpCountLabel.textContent = inviteType === "group" ? "Jumlah Orang yang Hadir" : "Jumlah Tamu";
  }
  if (rsvpModeHint) {
    rsvpModeHint.textContent = inviteType === "group"
      ? `Mode grup aktif untuk ${guestName}. Setiap orang boleh isi RSVP masing-masing dari link ini.`
      : "Mode personal aktif. Nama tamu bisa langsung dikonfirmasi melalui form ini.";
  }
  if (inputNama && inviteType === "group") {
    inputNama.value = "";
    inputNama.placeholder = "Tulis nama Anda";
  } else if (inputNama && guestName !== "Bapak/Ibu/Saudara/i") {
    inputNama.value = guestName;
    inputNama.placeholder = "Nama tamu";
  }
}

function setCountdownNumber(el, value) {
  if (!el) return;
  const nextValue = String(value);
  if (el.textContent === nextValue) return;
  el.textContent = nextValue;
  el.classList.remove("tick");
  void el.offsetWidth;
  el.classList.add("tick");
}

function parseIsoDateTimeToMs(value) {
  const clean = String(value || "").trim();
  if (!clean) return NaN;

  const match = clean.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+\-]\d{2}:\d{2})?$/
  );
  if (!match) return NaN;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const tz = match[7] || "+07:00";

  let offsetMinutes = 0;
  if (tz === "Z") {
    offsetMinutes = 0;
  } else {
    const sign = tz.startsWith("-") ? -1 : 1;
    const parts = tz.slice(1).split(":");
    const tzHour = Number(parts[0] || 0);
    const tzMinute = Number(parts[1] || 0);
    offsetMinutes = sign * (tzHour * 60 + tzMinute);
  }

  return Date.UTC(year, month - 1, day, hour, minute, second) - (offsetMinutes * 60 * 1000);
}

function parseIndonesianDateToMs(dateText, timeText) {
  const rawDate = String(dateText || "").trim();
  if (!rawDate) return NaN;

  const normalized = rawDate
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const monthMap = {
    januari: 1,
    februari: 2,
    maret: 3,
    april: 4,
    mei: 5,
    juni: 6,
    juli: 7,
    agustus: 8,
    september: 9,
    oktober: 10,
    november: 11,
    desember: 12
  };

  let day = null;
  let month = null;
  let year = null;

  const rangeSameMonthMatch = normalized.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (rangeSameMonthMatch && monthMap[rangeSameMonthMatch[3]]) {
    day = Number(rangeSameMonthMatch[1]);
    month = Number(monthMap[rangeSameMonthMatch[3]]);
    year = Number(rangeSameMonthMatch[4]);
  } else {
    const rangeTwoMonthMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s*-\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (rangeTwoMonthMatch && monthMap[rangeTwoMonthMatch[2]]) {
      day = Number(rangeTwoMonthMatch[1]);
      month = Number(monthMap[rangeTwoMonthMatch[2]]);
      year = Number(rangeTwoMonthMatch[5]);
    }
  }

  if (!day || !month || !year) {
    const idMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (idMatch && monthMap[idMatch[2]]) {
      day = Number(idMatch[1]);
      month = Number(monthMap[idMatch[2]]);
      year = Number(idMatch[3]);
    } else {
      const slashMatch = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (slashMatch) {
        day = Number(slashMatch[1]);
        month = Number(slashMatch[2]);
        year = Number(slashMatch[3]);
      }
    }
  }

  if (!day || !month || !year) {
    const anyDateMatch = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/g);
    if (anyDateMatch && anyDateMatch.length) {
      const first = anyDateMatch[0].match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
      if (first && monthMap[first[2]]) {
        day = Number(first[1]);
        month = Number(monthMap[first[2]]);
        year = Number(first[3]);
      }
    }
  }

  if (!day || !month || !year) return NaN;

  let hour = 8;
  let minute = 0;
  const rawTime = String(timeText || "").trim().toLowerCase();
  if (rawTime) {
    const timeMatch = rawTime.match(/(\d{1,2})[.:](\d{2})/);
    if (timeMatch) {
      hour = Number(timeMatch[1]);
      minute = Number(timeMatch[2]);
    }
  }

  return Date.UTC(year, month - 1, day, hour, minute, 0) - (7 * 60 * 60 * 1000);
}

function parsePrimaryWeddingTimestamp() {
  const eventStartIso = String(currentConfig.eventStartISO || "").trim();
  if (eventStartIso) {
    const eventStartMs = parseIsoDateTimeToMs(eventStartIso);
    if (!Number.isNaN(eventStartMs)) return eventStartMs;
  }

  const isoValue = String(currentConfig.weddingDateISO || "").trim();
  if (isoValue) {
    const isoTime = parseIsoDateTimeToMs(isoValue);
    if (!Number.isNaN(isoTime)) return isoTime;
  }

  const resepsiDate = (currentConfig.resepsi && currentConfig.resepsi.date) || "";
  const resepsiTime = (currentConfig.resepsi && currentConfig.resepsi.time) || "";
  const resepsiMs = parseIndonesianDateToMs(resepsiDate, resepsiTime);
  if (!Number.isNaN(resepsiMs)) return resepsiMs;

  const akadDate = (currentConfig.akad && currentConfig.akad.date) || "";
  const akadTime = (currentConfig.akad && currentConfig.akad.time) || "";
  const akadMs = parseIndonesianDateToMs(akadDate, akadTime);
  if (!Number.isNaN(akadMs)) return akadMs;

  const heroMs = parseIndonesianDateToMs(currentConfig.heroDatePlace || "", resepsiTime);
  if (!Number.isNaN(heroMs)) return heroMs;

  return NaN;
}

function parseWeddingTimestamp() {
  return parsePrimaryWeddingTimestamp();
}

function parseCountdownTimestamp() {
  const primary = parsePrimaryWeddingTimestamp();
  if (Number.isNaN(primary)) return NaN;

  const eventStartIso = String(currentConfig.eventStartISO || "").trim();
  const weddingIso = String(currentConfig.weddingDateISO || "").trim();
  const sourceIso = eventStartIso || weddingIso;
  const resepsiTime = String((currentConfig.resepsi && currentConfig.resepsi.time) || "").trim();
  const akadTime = String((currentConfig.akad && currentConfig.akad.time) || "").trim();
  const hasExplicitEventTime = Boolean(
    /(\d{1,2})[.:](\d{2})/.test(resepsiTime) ||
    /(\d{1,2})[.:](\d{2})/.test(akadTime)
  );
  const isoLooksMidnight = /T00:00(?::00)?(?:Z|[+\-]\d{2}:\d{2})?$/i.test(sourceIso);

  // Jika admin hanya memilih tanggal tanpa jam, countdown terasa lebih natural
  // bila diarahkan ke akhir hari itu, bukan tepat jam 00:00.
  if (sourceIso && isoLooksMidnight && !hasExplicitEventTime) {
    return primary + ((24 * 60 * 60 * 1000) - 1000);
  }

  return primary;
}

function updateCountdown() {
  const weddingDate = parseCountdownTimestamp();

  if (Number.isNaN(weddingDate)) {
    countdownNodes.forEach((node) => setCountdownNumber(node, "-"));
    return;
  }

  const now = Date.now();
  const distance = weddingDate - now;

  if (distance <= 0) {
    countdownNodes.forEach((node) => setCountdownNumber(node, "0"));
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  setCountdownNumber(cdDays, String(days));
  setCountdownNumber(cdHours, String(hours).padStart(2, "0"));
  setCountdownNumber(cdMinutes, String(minutes).padStart(2, "0"));
  setCountdownNumber(cdSeconds, String(seconds).padStart(2, "0"));
}

function setupRevealAnimation() {
  if (revealAnimationSetupDone) return;
  revealAnimationSetupDone = true;

  const sections = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupMusicControl() {
  if (musicControlSetupDone) return;
  musicControlSetupDone = true;

  const runtime = musicController.setupMusicControl();
  if (runtime && typeof runtime.startMusicFromGesture === "function") {
    attemptMusicStartFromGesture = runtime.startMusicFromGesture;
  }
}

function createLeaf() {
  if (!leafLayer || leafLayer.childElementCount >= particleState.maxLeaves) return;

  const leaf = document.createElement("span");
  leaf.className = "leaf";
  const left = Math.random() * 100;
  const duration = (isLowPowerDevice ? 9 : 8) + Math.random() * (isLowPowerDevice ? 6 : 8);
  const delay = Math.random() * 1.2;
  const scale = 0.7 + Math.random() * 1.1;

  leaf.style.left = `${left}%`;
  leaf.style.animationDuration = `${duration}s`;
  leaf.style.animationDelay = `${delay}s`;
  leaf.style.transform = `scale(${scale})`;

  leafLayer.appendChild(leaf);
  setTimeout(() => leaf.remove(), (duration + delay) * 1000 + 200);
}

function createFlower() {
  if (!flowerLayer || flowerLayer.childElementCount >= particleState.maxFlowers) return;

  const petalCount = isLowPowerDevice ? 1 : (Math.random() < 0.45 ? 2 : 1);

  for (let i = 0; i < petalCount; i += 1) {
    if (flowerLayer.childElementCount >= particleState.maxFlowers) break;

    const flower = document.createElement("span");
    flower.className = "flower";
    const left = Math.random() * 100;
    const duration = (isLowPowerDevice ? 9 : 7.5) + Math.random() * (isLowPowerDevice ? 4.5 : 6);
    const delay = Math.random() * 1.1;
    const scale = 0.6 + Math.random() * 0.85;
    const driftX = (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 44);
    const spinDeg = (Math.random() < 0.5 ? -1 : 1) * (220 + Math.random() * 240);

    flower.style.left = `${left}%`;
    flower.style.animationDuration = `${duration}s`;
    flower.style.animationDelay = `${delay}s`;
    flower.style.setProperty("--petal-scale", scale.toFixed(3));
    flower.style.setProperty("--drift-x", `${driftX.toFixed(2)}px`);
    flower.style.setProperty("--spin-deg", `${spinDeg.toFixed(1)}deg`);

    flowerLayer.appendChild(flower);
    setTimeout(() => flower.remove(), (duration + delay) * 1000 + 220);
  }
}

function startTimers() {
  if (!particleState.countdownTimer) {
    particleState.countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  if (prefersReducedMotion) return;

  if (!particleState.leafTimer && leafLayer) {
    particleState.leafTimer = window.setInterval(createLeaf, isSmallMobileViewport ? 2600 : (isLowPowerDevice ? 1300 : 900));
  }

  if (!particleState.flowerTimer && flowerLayer) {
    particleState.flowerTimer = window.setInterval(createFlower, isSmallMobileViewport ? 3400 : (isLowPowerDevice ? 1600 : 1100));
  }
}

function stopTimers() {
  if (particleState.countdownTimer) {
    clearInterval(particleState.countdownTimer);
    particleState.countdownTimer = null;
  }

  if (particleState.leafTimer) {
    clearInterval(particleState.leafTimer);
    particleState.leafTimer = null;
  }

  if (particleState.flowerTimer) {
    clearInterval(particleState.flowerTimer);
    particleState.flowerTimer = null;
  }
}

function setupVisibilityOptimization() {
  if (visibilityOptimizationSetupDone) return;
  visibilityOptimizationSetupDone = true;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopTimers();
      clearGalleryAutoplay();
    } else {
      updateCountdown();
      startTimers();
      renderGalleryGrid(currentConfig.galleryPhotos);
    }
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeGalleryLightbox();
    }
  });
}

if (lightboxCloseBtn) {
  lightboxCloseBtn.addEventListener("click", closeGalleryLightbox);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) {
    closeGalleryLightbox();
  }
});

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!RSVP_API_URL || RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
      setFormStatus("URL backend belum diisi pada config.js", "is-error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      nama: formData.get("nama")?.toString().trim(),
      jumlah: Number(formData.get("jumlah")),
      kehadiran: formData.get("kehadiran"),
      ucapan: formData.get("ucapan")?.toString().trim() || "-",
      guestCode: getGuestCodeFromUrl(),
      inviteType: getGuestInviteTypeFromUrl(),
      guestLabel: getGuestNameFromUrl()
    };

    setFormStatus("Mengirim RSVP...", "is-loading");
    if (submitRsvpBtn) submitRsvpBtn.disabled = true;

    try {
      const response = await fetchWithTimeout(RSVP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      }, 45000);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim data");
      }

      form.reset();
      applyGuestName();
      setFormStatus("RSVP berhasil dikirim. Terima kasih.", "is-success");
      await loadWishes();
      scrollToWishesPanel();
    } catch (error) {
      if (/terlalu lama|aborted|abort/i.test(error.message || "")) {
        setFormStatus("RSVP kemungkinan sudah terkirim, tetapi server lambat memberi balasan. Silakan cek daftar ucapan atau coba refresh sebelum mengirim ulang.", "is-error");
        await loadWishes();
        scrollToWishesPanel();
        return;
      }
      setFormStatus(`Terjadi kesalahan: ${error.message}`, "is-error");
    } finally {
      if (submitRsvpBtn) submitRsvpBtn.disabled = false;
    }
  });
}

if (wishesList) {
  const pauseAutoScroll = () => {
    wishesAutoPauseUntil = Date.now() + 4500;
  };

  wishesList.addEventListener("wheel", pauseAutoScroll, { passive: true });
  wishesList.addEventListener("touchstart", pauseAutoScroll, { passive: true });
  wishesList.addEventListener("touchmove", pauseAutoScroll, { passive: true });
}

function setWishesCollapsed(isCollapsed) {
  const panel = wishesList ? wishesList.closest(".wishes-panel") : null;
  if (!panel || !wishesToggle) return;
  panel.classList.toggle("is-collapsed", isCollapsed);
  wishesToggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  wishesToggle.textContent = isCollapsed ? "Lihat" : "Tutup";
  if (isCollapsed) {
    stopWishesAutoScroll();
  } else {
    refreshWishesAutoScroll();
  }
}

function syncWishesMobileState() {
  if (!wishesToggle) return;
  setWishesCollapsed(window.matchMedia("(max-width: 900px)").matches);
}

if (wishesToggle) {
  wishesToggle.addEventListener("click", () => {
    const panel = wishesList ? wishesList.closest(".wishes-panel") : null;
    setWishesCollapsed(!(panel && panel.classList.contains("is-collapsed")));
  });
  window.addEventListener("resize", syncWishesMobileState);
}

if (resepsiMapEmbed) {
  resepsiMapEmbed.addEventListener("load", () => {
    const wrap = resepsiMapEmbed.closest(".map-frame-wrap");
    if (wrap) wrap.classList.add("is-loaded");
  });
}

function setupThemeMotion() {
  updateThemeParallax();
  if (themeMotionSetupDone) return;
  themeMotionSetupDone = true;
  window.addEventListener("scroll", scheduleThemeParallax, { passive: true });
  window.addEventListener("resize", scheduleThemeParallax);
}

async function initPage() {
  setLoaderMessage("Memuat data undangan dari Sheet...", false);

  try {
    await hydrateRuntimeConfig();
    const ready = await loadServerConfig();
    const shouldUseServer = RSVP_API_URL && !RSVP_API_URL.includes("PASTE_WEB_APP_URL");

    if (shouldUseServer && !ready) {
      setLoaderMessage("Gagal memuat data Sheet. Periksa Apps Script lalu coba lagi.", true);
      return;
    }
  } finally {
    const shouldKeepLoading = loaderRetry && !loaderRetry.hidden;
    if (shouldKeepLoading) return;

    applyWeddingConfig();
    pageContentApplied = true;
    applyGuestName();
    loadWishes();
    syncWishesMobileState();
    updateCountdown();
    setupRevealAnimation();
    setupMusicControl();
    setupVisibilityOptimization();
    setupThemeMotion();
    setupInvitationGate();
    startTimers();
    startWishesRefresh();

    window.requestAnimationFrame(() => {
      document.body.classList.remove("is-loading");
      document.body.removeAttribute("aria-busy");
      if (pageLoader) pageLoader.setAttribute("aria-hidden", "true");
    });
  }
}

initPage();

if (loaderRetry) {
  loaderRetry.addEventListener("click", () => {
    loaderRetry.hidden = true;
    initPage();
  });
}

