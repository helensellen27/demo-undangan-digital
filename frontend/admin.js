const ADMIN_RSVP_API_URL = window.RSVP_API_URL || "";
const ADMIN_LOCAL_CONFIG = window.ADMIN_CONFIG || {};
const ADMIN_WEDDING_CONFIG = window.WEDDING_CONFIG || {};

const SHARED_BANK_OPTIONS = [
  { code: "bca", name: "BCA", logoUrl: "assets/bank/bca.svg", aliases: ["bank central asia"] },
  { code: "bri", name: "BRI", logoUrl: "assets/bank/bri.svg", aliases: ["bank rakyat indonesia"] },
  { code: "bni", name: "BNI", logoUrl: "assets/bank/bni.svg", aliases: ["bank negara indonesia"] },
  { code: "mandiri", name: "Mandiri", logoUrl: "assets/bank/mandiri.svg", aliases: ["bank mandiri"] },
  { code: "bsi", name: "BSI", logoUrl: "assets/bank/bsi.svg", aliases: ["bank syariah indonesia"] },
  { code: "cimb", name: "CIMB Niaga", logoUrl: "assets/bank/cimb.svg", aliases: ["cimb", "cimb niaga"] },
  { code: "permata", name: "Permata", logoUrl: "assets/bank/permata.svg", aliases: ["permata bank"] },
  { code: "btn", name: "BTN", logoUrl: "assets/bank/btn.svg", aliases: ["bank tabungan negara"] },
  { code: "danamon", name: "Danamon", logoUrl: "assets/bank/danamon.svg", aliases: ["bank danamon"] },
  { code: "panin", name: "Panin", logoUrl: "assets/bank/panin.svg", aliases: ["panin bank", "bank panin"] }
];
const SHARED_EWALLET_OPTIONS = [
  { code: "dana", name: "DANA", logoUrl: "assets/ewallet/dana.svg", aliases: ["dana"] },
  { code: "ovo", name: "OVO", logoUrl: "assets/ewallet/ovo.svg", aliases: ["ovo"] },
  { code: "gopay", name: "GoPay", logoUrl: "assets/ewallet/gopay.svg", aliases: ["gopay", "go-pay"] },
  { code: "shopeepay", name: "ShopeePay", logoUrl: "assets/ewallet/shopeepay.svg", aliases: ["shopeepay", "shopee pay"] },
  { code: "linkaja", name: "LinkAja", logoUrl: "assets/ewallet/linkaja.svg", aliases: ["linkaja", "link aja"] },
  { code: "sakuku", name: "Sakuku", logoUrl: "assets/ewallet/sakuku.svg", aliases: ["sakuku"] }
];
const SHARED_BANK_CATALOG = Object.fromEntries(SHARED_BANK_OPTIONS.map((item) => [item.code, item]));
const SHARED_EWALLET_CATALOG = Object.fromEntries(SHARED_EWALLET_OPTIONS.map((item) => [item.code, item]));

function sharedNormalizeThemeName(value) {
  const theme = String(value || "").trim().toLowerCase();
  return ["botanical", "rose", "royal", "minimal"].includes(theme) ? theme : "botanical";
}

function parseJsonValue(input, fallback) {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch (error) {
    return fallback;
  }
}

function sharedCleanPhotoArray(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => String(item || "").trim()).filter(Boolean);
}

function sharedNormalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(text);
}

function sharedClampPercent(value, fallback = 50) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, num));
}

function sharedExtractDriveFileId(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  const idFromQuery = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idFromQuery && idFromQuery[1]) return idFromQuery[1];
  const idFromPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idFromPath && idFromPath[1]) return idFromPath[1];
  return "";
}

function sharedIsLikelyDriveFileId(value) {
  const clean = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{20,}$/.test(clean);
}

function extractDriveResourceKey(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  const keyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9._-]+)/i);
  return (keyMatch && keyMatch[1]) || "";
}

function sharedNormalizeGalleryMode(value) {
  return String(value || "").toLowerCase() === "carousel" ? "carousel" : "grid";
}

function sharedNormalizeGalleryStyle(value) {
  const style = String(value || "").toLowerCase();
  if (["elegant", "soft", "polaroid", "clean"].includes(style)) return style;
  return "elegant";
}

function sharedNormalizeGalleryPhotoFocusMap(input) {
  const source = parseJsonValue(input, {});
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const normalized = {};
  Object.keys(source).forEach((rawKey) => {
    const key = String(rawKey || "").trim();
    if (!key) return;
    const item = source[rawKey];
    if (!item || typeof item !== "object") return;
    normalized[key] = {
      x: sharedClampPercent(item.x, 50),
      y: sharedClampPercent(item.y, 50)
    };
  });
  return normalized;
}

function findProviderOptionByCode(options, code) {
  const clean = String(code || "").trim().toLowerCase();
  return options.find((item) => item.code === clean) || null;
}

function findProviderOptionByName(options, name) {
  const clean = String(name || "").trim().toLowerCase();
  if (!clean) return null;
  return options.find((item) =>
    item.name.toLowerCase() === clean
    || (Array.isArray(item.aliases) && item.aliases.some((alias) => alias.toLowerCase() === clean))
  ) || null;
}

function sharedNormalizeGiftType(value) {
  const clean = String(value || "").trim().toLowerCase();
  return clean === "ewallet" ? "ewallet" : "bank";
}

function sharedGetGiftProviderCode(account) {
  return String(account && (account.providerCode || account.bankCode) || "").trim().toLowerCase();
}

function sharedGetGiftProviderName(account) {
  return String(account && (account.providerName || account.bankName) || "").trim();
}

function sharedInferGiftAccountType(account) {
  const explicit = String(account && (account.type || account.category) || "").trim().toLowerCase();
  const providerCode = sharedGetGiftProviderCode(account);
  const providerName = sharedGetGiftProviderName(account);
  if (providerCode && SHARED_EWALLET_CATALOG[providerCode]) return "ewallet";
  if (providerCode && SHARED_BANK_CATALOG[providerCode]) return "bank";
  if (findProviderByName(SHARED_EWALLET_CATALOG, providerName)) return "ewallet";
  if (findProviderByName(SHARED_BANK_CATALOG, providerName)) return "bank";
  if (explicit === "bank" || explicit === "ewallet") return explicit;
  const source = `${providerCode} ${providerName}`.toLowerCase();
  const ewalletKeywords = ["dana", "ovo", "gopay", "go-pay", "shopeepay", "shopee pay", "linkaja", "link aja", "sakuku"];
  return ewalletKeywords.some((keyword) => source.includes(keyword)) ? "ewallet" : "bank";
}

function findProviderByName(catalog, name) {
  const clean = String(name || "").trim().toLowerCase();
  if (!clean) return null;
  return Object.values(catalog).find((item) =>
    item.name.toLowerCase() === clean
    || (Array.isArray(item.aliases) && item.aliases.some((alias) => alias.toLowerCase() === clean))
  ) || null;
}

function sharedNormalizeGiftAccounts(input, options = {}) {
  const source = parseJsonValue(input, []);
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      const type = sharedInferGiftAccountType(item);
      const providerCode = sharedGetGiftProviderCode(item);
      const providerName = sharedGetGiftProviderName(item);
      const catalog = type === "ewallet" ? SHARED_EWALLET_CATALOG : SHARED_BANK_CATALOG;
      const providerMeta = (providerCode && catalog[providerCode]) || findProviderByName(catalog, providerName);
      return {
        type,
        providerCode: providerMeta ? providerMeta.code : providerCode,
        providerName: String((providerMeta && providerMeta.name) || providerName || "").trim(),
        accountNumber: String(item && item.accountNumber || "").replace(/\D+/g, ""),
        accountHolder: String(item && item.accountHolder || "").trim(),
        logoUrl: String((providerMeta && providerMeta.logoUrl) || item && item.logoUrl || "").trim(),
        isActive: sharedNormalizeBoolean(item && item.isActive, true)
      };
    })
    .filter((item) => options.keepEmpty || item.accountNumber);
}

function sharedCreateDefaultGiftAccount(type = "bank") {
  const cleanType = sharedNormalizeGiftType(type);
  const fallbackProvider = cleanType === "ewallet" ? SHARED_EWALLET_OPTIONS[0] : SHARED_BANK_OPTIONS[0];
  return {
    type: cleanType,
    providerCode: fallbackProvider.code,
    providerName: fallbackProvider.name,
    accountNumber: "",
    accountHolder: "",
    logoUrl: fallbackProvider.logoUrl,
    isActive: true
  };
}

function sharedGetBankOptionByCode(code) {
  return findProviderOptionByCode(SHARED_BANK_OPTIONS, code);
}

function sharedGetBankOptionByName(name) {
  return findProviderOptionByName(SHARED_BANK_OPTIONS, name);
}

function sharedGetEwalletOptionByCode(code) {
  return findProviderOptionByCode(SHARED_EWALLET_OPTIONS, code);
}

function sharedGetEwalletOptionByName(name) {
  return findProviderOptionByName(SHARED_EWALLET_OPTIONS, name);
}

function sharedNormalizeMusicPlaybackMode(value) {
  return String(value || "").trim().toLowerCase() === "shuffle" ? "shuffle" : "ordered";
}

function sharedNormalizeMusicTrack(item, index = 0, options = {}) {
  const source = (item && typeof item === "object") ? item : {};
  const sourceUrl = String(source.url || source.audioStreamUrl || source.downloadUrl || source.publicUrl || source.webUrl || "").trim();
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
    isActive: source.isActive === undefined ? true : sharedNormalizeBoolean(source.isActive, true)
  };
}

function sharedNormalizeMusicPlaylist(input, fallbackUrl = "", options = {}) {
  const source = parseJsonValue(input, []);
  let tracks = Array.isArray(source)
    ? source
      .map((item, index) => sharedNormalizeMusicTrack(item, index, options))
      .filter((item) => item.url || item.sourceUrl)
    : [];
  const hasRealDriveTrack = tracks.some((item) => sharedIsLikelyDriveFileId(item.id) || sharedExtractDriveFileId(item.sourceUrl || item.url));
  if (hasRealDriveTrack) {
    tracks = tracks.filter((item) => item.id !== "default-track-1" && item.id !== "legacy-track-1");
  }
  if (!tracks.length && fallbackUrl) {
    tracks = [sharedNormalizeMusicTrack({
      id: "legacy-track-1",
      title: "Musik Utama",
      url: fallbackUrl,
      isActive: true
    }, 0, options)];
  }
  return tracks;
}

const adminApiClient = window.WeddingAdminApi.createAdminApiClient({ rsvpApiUrl: ADMIN_RSVP_API_URL });

const fields = {
  brandInitials: document.getElementById("brandInitials"),
  seoTitle: document.getElementById("seoTitle"),
  seoDescription: document.getElementById("seoDescription"),
  themeName: document.getElementById("themeName"),
  heroOverline: document.getElementById("heroOverline"),
  brideShortName: document.getElementById("brideShortName"),
  groomShortName: document.getElementById("groomShortName"),
  brideFullName: document.getElementById("brideFullName"),
  groomFullName: document.getElementById("groomFullName"),
  brideParents: document.getElementById("brideParents"),
  groomParents: document.getElementById("groomParents"),
  heroDatePlace: document.getElementById("heroDatePlace"),
  heroDateStart: document.getElementById("heroDateStart"),
  heroDateEnd: document.getElementById("heroDateEnd"),
  heroDateCity: document.getElementById("heroDateCity"),
  heroBackgroundPhoto: document.getElementById("heroBackgroundPhoto"),
  footerNames: document.getElementById("footerNames"),
  weddingDateTimeLocal: document.getElementById("weddingDateTimeLocal"),
  weddingTimeOffset: document.getElementById("weddingTimeOffset"),
  weddingDateISO: document.getElementById("weddingDateISO"),
  eventStartDateTimeLocal: document.getElementById("eventStartDateTimeLocal"),
  eventStartOffset: document.getElementById("eventStartOffset"),
  eventStartISO: document.getElementById("eventStartISO"),
  akadDate: document.getElementById("akadDate"),
  akadTime: document.getElementById("akadTime"),
  akadVenue: document.getElementById("akadVenue"),
  akadMapUrl: document.getElementById("akadMapUrl"),
  resepsiDate: document.getElementById("resepsiDate"),
  resepsiTime: document.getElementById("resepsiTime"),
  resepsiVenue: document.getElementById("resepsiVenue"),
  resepsiMapUrl: document.getElementById("resepsiMapUrl"),
  quranVerseArabic: document.getElementById("quranVerseArabic"),
  quranVerseTranslation: document.getElementById("quranVerseTranslation"),
  quranVerseReference: document.getElementById("quranVerseReference"),
  hadithText: document.getElementById("hadithText"),
  hadithReference: document.getElementById("hadithReference"),
  marriageDoaText: document.getElementById("marriageDoaText"),
  marriageDoaReference: document.getElementById("marriageDoaReference"),
  storyDate1: document.getElementById("storyDate1"),
  storyTitle1: document.getElementById("storyTitle1"),
  storyDesc1: document.getElementById("storyDesc1"),
  storyDate2: document.getElementById("storyDate2"),
  storyTitle2: document.getElementById("storyTitle2"),
  storyDesc2: document.getElementById("storyDesc2"),
  storyDate3: document.getElementById("storyDate3"),
  storyTitle3: document.getElementById("storyTitle3"),
  storyDesc3: document.getElementById("storyDesc3"),
  loveStoryPhotos: document.getElementById("loveStoryPhotos"),
  galleryPhotos: document.getElementById("galleryPhotos"),
  galleryMode: document.getElementById("galleryMode"),
  galleryMaxItems: document.getElementById("galleryMaxItems"),
  galleryAutoplaySec: document.getElementById("galleryAutoplaySec"),
  galleryStyle: document.getElementById("galleryStyle"),
  giftEnabled: document.getElementById("giftEnabled"),
  giftSectionTitle: document.getElementById("giftSectionTitle"),
  giftSectionSubtitle: document.getElementById("giftSectionSubtitle"),
  backgroundMusicUrl: document.getElementById("backgroundMusicUrl"),
  musicPlaybackMode: document.getElementById("musicPlaybackMode"),
  musicStartSec: document.getElementById("musicStartSec"),
  musicLoopStartSec: document.getElementById("musicLoopStartSec"),
  musicLoopEndSec: document.getElementById("musicLoopEndSec")
};

const adminKeyInput = document.getElementById("adminKey");
const apiUrlInput = document.getElementById("apiUrl");
const invitationBaseUrlInput = document.getElementById("invitationBaseUrl");

const statusConn = document.getElementById("statusConn");
const statusConfig = document.getElementById("statusConfig");
const statusGallery = document.getElementById("statusGallery");
const statusGift = document.getElementById("statusGift");
const statusMusic = document.getElementById("statusMusic");
const statusGuests = document.getElementById("statusGuests");
const statusRsvps = document.getElementById("statusRsvps");

const guestInput = document.getElementById("guestInput");
const guestSearch = document.getElementById("guestSearch");
const guestGroupFilter = document.getElementById("guestGroupFilter");
const guestStatusFilter = document.getElementById("guestStatusFilter");
const guestPageSize = document.getElementById("guestPageSize");
const guestPageInfo = document.getElementById("guestPageInfo");
const btnGuestPrev = document.getElementById("btnGuestPrev");
const btnGuestNext = document.getElementById("btnGuestNext");
const guestLinks = document.getElementById("guestLinks");
const guestTableBody = document.getElementById("guestTableBody");
const rsvpSearch = document.getElementById("rsvpSearch");
const rsvpKehadiranFilter = document.getElementById("rsvpKehadiranFilter");
const rsvpPageSize = document.getElementById("rsvpPageSize");
const rsvpPageInfo = document.getElementById("rsvpPageInfo");
const btnRsvpPrev = document.getElementById("btnRsvpPrev");
const btnRsvpNext = document.getElementById("btnRsvpNext");
const rsvpTableBody = document.getElementById("rsvpTableBody");
const photoFilesInput = document.getElementById("photoFiles");
const heroPhotoFileInput = document.getElementById("heroPhotoFile");
const loveStoryPhotoFilesInput = document.getElementById("loveStoryPhotoFiles");
const deletePhotoUrlsInput = document.getElementById("deletePhotoUrls");
const musicFileInput = document.getElementById("musicFile");
const galleryPreview = document.getElementById("galleryPreview");
const loveStoryPreview = document.getElementById("loveStoryPreview");
const giftAccountsEditor = document.getElementById("giftAccountsEditor");
const deleteFromDriveInput = document.getElementById("deleteFromDrive");
const btnHeroFromGallery = document.getElementById("btnHeroFromGallery");
const btnLoveStoryFromGallery = document.getElementById("btnLoveStoryFromGallery");
const btnAddGiftBank = document.getElementById("btnAddGiftBank");
const btnAddGiftEwallet = document.getElementById("btnAddGiftEwallet");
const btnLoadMusicLibrary = document.getElementById("btnLoadMusicLibrary");
const musicLibraryEditor = document.getElementById("musicLibraryEditor");
const adminSectionNavigator = window.WeddingAdminNavigation
  ? window.WeddingAdminNavigation.createAdminSectionNavigator({
    tabs: document.querySelectorAll(".admin-tab"),
    sections: document.querySelectorAll(".admin-panel-section")
  })
  : null;
const previewPanel = document.getElementById("previewPanel");
const previewFrame = document.getElementById("previewFrame");
const btnActionSave = document.getElementById("btnActionSave");
const btnActionLoad = document.getElementById("btnActionLoad");
const btnPreviewToggle = document.getElementById("btnPreviewToggle");
const btnPreviewRefresh = document.getElementById("btnPreviewRefresh");
const btnScrollTop = document.getElementById("btnScrollTop");
const dirtyState = document.getElementById("dirtyState");
const draftRestoreBanner = document.getElementById("draftRestoreBanner");
const draftRestoreText = document.getElementById("draftRestoreText");
const btnRestoreDraft = document.getElementById("btnRestoreDraft");
const btnDiscardDraft = document.getElementById("btnDiscardDraft");
const toastRoot = document.getElementById("toastRoot");
const adminUi = window.WeddingAdminUi.createAdminUi({ toastRoot });
const setStatus = adminUi.setStatus;
const showToast = adminUi.showToast;
const ADMIN_KEY_STORAGE_KEY = "wedding_admin_key";
const INVITATION_BASE_URL_STORAGE_KEY = "wedding_invitation_base_url";
const ADMIN_PREVIEW_DRAFT_KEY = "wedding_admin_preview_draft_v1";
const ADMIN_LOCAL_DRAFT_KEY = "wedding_admin_local_draft_v1";

const BANK_OPTIONS = SHARED_BANK_OPTIONS;
const EWALLET_OPTIONS = SHARED_EWALLET_OPTIONS;

document.getElementById("btnLoadConfig").addEventListener("click", loadConfigFromServer);
document.getElementById("btnSaveConfig").addEventListener("click", saveConfigToServer);
document.getElementById("btnUploadPhotos").addEventListener("click", uploadPhotosToDrive);
document.getElementById("btnUploadHeroPhoto").addEventListener("click", uploadHeroPhotoToDrive);
document.getElementById("btnUploadLoveStoryPhotos").addEventListener("click", uploadLoveStoryPhotosToDrive);
document.getElementById("btnDeletePhotos").addEventListener("click", deletePhotosFromDriveAndGallery);
document.getElementById("btnUploadMusic").addEventListener("click", uploadMusicToDrive);
document.getElementById("btnImportGuests").addEventListener("click", importGuests);
document.getElementById("btnLoadGuests").addEventListener("click", loadGuests);
document.getElementById("btnExportGuestsCsv").addEventListener("click", exportGuestsCsv);
document.getElementById("btnLoadRsvps").addEventListener("click", loadRsvps);
document.getElementById("btnGenerateHeroDate").addEventListener("click", generateHeroDatePlaceFromInputs);
document.getElementById("btnApplyGallerySelection").addEventListener("click", applySelectedGalleryUrls);
function addGiftAccount(type) {
  const label = normalizeGiftType(type) === "ewallet" ? "e-wallet" : "bank";
  const current = readGiftAccountsFromEditor();
  current.push(createDefaultGiftAccount(type));
  renderGiftAccountsEditor(current);
  setStatus(statusGift, `Akun ${label} baru ditambahkan.`);
  markDirty();
  schedulePreviewRefresh();
}

if (btnAddGiftBank) {
  btnAddGiftBank.addEventListener("click", () => {
    addGiftAccount("bank");
  });
}

if (btnAddGiftEwallet) {
  btnAddGiftEwallet.addEventListener("click", () => {
    addGiftAccount("ewallet");
  });
}

const legacyBtnAddGiftAccount = document.getElementById("btnAddGiftAccount");
if (legacyBtnAddGiftAccount) {
  legacyBtnAddGiftAccount.addEventListener("click", () => {
    const current = readGiftAccountsFromEditor();
    current.push(createDefaultGiftAccount());
    renderGiftAccountsEditor(current);
    setStatus(statusGift, "Akun gift baru ditambahkan.");
    markDirty();
    schedulePreviewRefresh();
  });
}
if (btnLoadMusicLibrary) {
  btnLoadMusicLibrary.addEventListener("click", loadMusicLibrary);
}
if (btnActionSave) {
  btnActionSave.addEventListener("click", saveConfigToServer);
}
if (btnActionLoad) {
  btnActionLoad.addEventListener("click", loadConfigFromServer);
}

apiUrlInput.value = ADMIN_RSVP_API_URL;
let selectedGalleryUrls = new Set();
let galleryPhotoFocusMap = {};
let giftAccountsDraft = [];
let musicPlaylistDraft = [];
let guestAdminModule = null;
let rsvpAdminModule = null;
let isDirty = false;
let isHydratingForm = false;
let autosaveTimer = null;
let pendingLocalDraft = null;

function getDefaultInvitationBaseUrl() {
  const fromConfig = (ADMIN_LOCAL_CONFIG && ADMIN_LOCAL_CONFIG.invitationBaseUrl) || "";
  if (fromConfig.trim()) return fromConfig.trim();
  const path = String(window.location.pathname || "/");
  if (/\/admin\.html?$/i.test(path)) {
    return `${window.location.origin}${path.replace(/admin\.html?$/i, "")}`;
  }
  if (path.endsWith("/")) {
    return `${window.location.origin}${path}`;
  }
  return `${window.location.origin}${path}/`;
}

function loadSavedInvitationBaseUrl() {
  try {
    const saved = localStorage.getItem(INVITATION_BASE_URL_STORAGE_KEY);
    if (saved && saved.trim()) {
      invitationBaseUrlInput.value = saved.trim();
      return;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }

  invitationBaseUrlInput.value = getDefaultInvitationBaseUrl();
}

function applyInvitationBaseUrl(value, shouldPersist = true) {
  const clean = String(value || "").trim();
  if (!clean) return false;
  invitationBaseUrlInput.value = clean;
  if (shouldPersist) saveInvitationBaseUrl(clean);
  refreshGuestViews();
  return true;
}

function saveInvitationBaseUrl(value) {
  try {
    const clean = (value || "").trim();
    if (!clean) {
      localStorage.removeItem(INVITATION_BASE_URL_STORAGE_KEY);
      return;
    }
    localStorage.setItem(INVITATION_BASE_URL_STORAGE_KEY, clean);
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function loadSavedAdminKey() {
  try {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE_KEY);
    if (saved) {
      adminKeyInput.value = saved;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function saveAdminKey(value) {
  try {
    if (!value) {
      localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ADMIN_KEY_STORAGE_KEY, value);
  } catch (error) {
    // Ignore localStorage access issues.
  }
}

function getAdminKeyOrThrow() {
  const fromInput = adminKeyInput.value.trim();
  if (fromInput) {
    saveAdminKey(fromInput);
    return fromInput;
  }

  try {
    const stored = (localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
    if (stored) {
      adminKeyInput.value = stored;
      return stored;
    }
  } catch (error) {
    // Ignore localStorage access issues.
  }

  throw new Error("Admin key wajib diisi");
}

function updateDirtyStateLabel() {
  if (!dirtyState) return;
  dirtyState.classList.toggle("is-dirty", isDirty);
  dirtyState.classList.toggle("is-clean", !isDirty);
  dirtyState.textContent = isDirty ? "Belum disimpan" : "Semua perubahan tersimpan";
}

function readLocalDraft() {
  try {
    const raw = localStorage.getItem(ADMIN_LOCAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeLocalDraft() {
  try {
    localStorage.setItem(ADMIN_LOCAL_DRAFT_KEY, JSON.stringify({
      savedAt: Date.now(),
      data: readConfigFromForm()
    }));
  } catch (error) {
    // Abaikan jika localStorage penuh/terblokir.
  }
}

function clearLocalDraft() {
  pendingLocalDraft = null;
  try {
    localStorage.removeItem(ADMIN_LOCAL_DRAFT_KEY);
  } catch (error) {
    // Abaikan jika localStorage tidak tersedia.
  }
  if (draftRestoreBanner) draftRestoreBanner.hidden = true;
}

function scheduleLocalDraftAutosave() {
  if (isHydratingForm) return;
  if (autosaveTimer) window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    writeLocalDraft();
  }, 650);
}

function markDirty() {
  if (isHydratingForm) return;
  isDirty = true;
  updateDirtyStateLabel();
  scheduleLocalDraftAutosave();
}

function markClean(clearDraft = true) {
  isDirty = false;
  updateDirtyStateLabel();
  if (clearDraft) clearLocalDraft();
}

function isConfigEditTarget(target) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return false;
  if (target instanceof HTMLInputElement && target.type === "file") return false;
  if (target === adminKeyInput || target === apiUrlInput || target === invitationBaseUrlInput) return false;
  const section = target.closest(".admin-panel-section");
  if (!section) return false;
  return section.id !== "tamuRsvpCard";
}

function formatDraftTime(timestamp) {
  const date = new Date(Number(timestamp || 0));
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    return "";
  }
}

function showDraftRestoreBanner(draft) {
  pendingLocalDraft = draft;
  if (!draftRestoreBanner) return;
  const timeText = formatDraftTime(draft && draft.savedAt);
  if (draftRestoreText) {
    draftRestoreText.textContent = timeText
      ? `Ada draft lokal dari ${timeText} yang belum disimpan ke server.`
      : "Ada draft lokal yang belum disimpan ke server.";
  }
  draftRestoreBanner.hidden = false;
}

function setActiveAdminSection(targetId) {
  if (adminSectionNavigator) adminSectionNavigator.setActive(targetId);
}

function getAdminPreviewUrl() {
  const previewUrl = new URL("./index.html", window.location.href);
  previewUrl.searchParams.set("preview", "admin");
  previewUrl.searchParams.set("open", "1");
  previewUrl.searchParams.set("to", "Preview Tamu");
  return previewUrl.toString();
}

function writePreviewDraftToStorage() {
  try {
    const draft = readConfigFromForm();
    localStorage.setItem(ADMIN_PREVIEW_DRAFT_KEY, JSON.stringify({
      savedAt: Date.now(),
      data: draft
    }));
  } catch (error) {
    // Abaikan jika storage tidak tersedia.
  }
}

let previewRefreshTimer = null;
let previewHasPendingDraft = false;

function refreshPreviewFrame(forceReload = false) {
  if (!previewFrame) return;
  writePreviewDraftToStorage();
  previewHasPendingDraft = false;

  if (!previewFrame.src || forceReload) {
    const previewUrl = new URL(getAdminPreviewUrl());
    previewUrl.searchParams.set("_ts", String(Date.now()));
    previewFrame.src = previewUrl.toString();
    return;
  }

  try {
    previewFrame.contentWindow.location.reload();
  } catch (error) {
    const previewUrl = new URL(getAdminPreviewUrl());
    previewUrl.searchParams.set("_ts", String(Date.now()));
    previewFrame.src = previewUrl.toString();
  }
}

function schedulePreviewRefresh() {
  if (previewRefreshTimer) {
    clearTimeout(previewRefreshTimer);
  }
  previewRefreshTimer = window.setTimeout(() => {
    writePreviewDraftToStorage();
    if (!previewPanel || previewPanel.hidden) return;
    previewHasPendingDraft = true;
    setStatus(statusConfig, "Draft preview diperbarui. Klik Refresh Preview untuk memuat ulang tampilan.");
  }, 420);
}

function togglePreviewPanel(forceOpen) {
  if (!previewPanel) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : previewPanel.hidden;
  previewPanel.hidden = !shouldOpen;
  if (btnPreviewToggle) {
    btnPreviewToggle.textContent = shouldOpen ? "Sembunyikan Preview" : "Lihat Preview";
  }
  if (shouldOpen) {
    refreshPreviewFrame(!previewFrame.src || previewHasPendingDraft);
    previewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function extractDriveFileId(value) {
  return sharedExtractDriveFileId(value);
}

function isLikelyDriveFileId(value) {
  return sharedIsLikelyDriveFileId(value);
}

function buildMusicProxyUrl(fileMeta) {
  const sourceUrl = String(fileMeta && (fileMeta.audioStreamUrl || fileMeta.downloadUrl || fileMeta.publicUrl || fileMeta.webUrl) || "").trim();
  const rawId = String(fileMeta && fileMeta.id || "").trim();
  const fileId = isLikelyDriveFileId(rawId) ? rawId : extractDriveFileId(sourceUrl);
  const resourceKey = String(fileMeta && fileMeta.resourceKey || "").trim() || extractDriveResourceKey(sourceUrl);
  const params = new URLSearchParams();

  if (fileId) params.set("fileId", fileId);
  if (resourceKey) params.set("resourceKey", resourceKey);
  if (!fileId && sourceUrl) params.set("src", sourceUrl);
  if (!params.toString()) return "";

  return `/api/music?${params.toString()}`;
}

function normalizeMusicPlaybackMode(value) {
  return sharedNormalizeMusicPlaybackMode(value);
}

function normalizeMusicTrack(item, index = 0) {
  return sharedNormalizeMusicTrack(item, index, {
    buildUrl: buildMusicProxyUrl,
    idPrefix: "music-track"
  });
}

function normalizeMusicPlaylist(input, fallbackUrl = "") {
  return sharedNormalizeMusicPlaylist(input, fallbackUrl, {
    buildUrl: buildMusicProxyUrl,
    idPrefix: "music-track"
  });
}

function syncBackgroundMusicField() {
  const activeTrack = musicPlaylistDraft.find((item) => item.isActive && item.url);
  if (activeTrack) {
    fields.backgroundMusicUrl.value = activeTrack.url;
  }
}

function moveMusicTrack(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= musicPlaylistDraft.length) return;
  const next = [...musicPlaylistDraft];
  const temp = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = temp;
  musicPlaylistDraft = next;
  renderMusicLibraryEditor();
  markDirty();
  schedulePreviewRefresh();
}

function renderMusicLibraryEditor() {
  if (!musicLibraryEditor) return;
  musicLibraryEditor.innerHTML = "";

  if (!musicPlaylistDraft.length) {
    const empty = document.createElement("p");
    empty.className = "preview-empty";
    empty.textContent = "Belum ada musik di playlist. Upload musik atau muat library Drive.";
    musicLibraryEditor.appendChild(empty);
    return;
  }

  musicPlaylistDraft.forEach((track, index) => {
    const item = document.createElement("article");
    item.className = "music-track-item";

    const head = document.createElement("div");
    head.className = "music-track-head";

    const titleWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "music-track-title";
    title.textContent = track.title || `Track ${index + 1}`;
    const meta = document.createElement("p");
    meta.className = "music-track-meta";
    meta.textContent = track.sourceUrl || track.url || "-";
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    const activeLabel = document.createElement("label");
    activeLabel.className = "inline-check";
    const activeInput = document.createElement("input");
    activeInput.type = "checkbox";
    activeInput.checked = Boolean(track.isActive);
    activeInput.addEventListener("change", () => {
      musicPlaylistDraft[index].isActive = activeInput.checked;
      syncBackgroundMusicField();
      markDirty();
      schedulePreviewRefresh();
    });
    const activeText = document.createElement("span");
    activeText.textContent = "Aktif";
    activeLabel.appendChild(activeInput);
    activeLabel.appendChild(activeText);

    head.appendChild(titleWrap);
    head.appendChild(activeLabel);

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = track.title || "";
    titleInput.placeholder = "Judul lagu";
    titleInput.addEventListener("input", () => {
      musicPlaylistDraft[index].title = titleInput.value.trim();
      title.textContent = musicPlaylistDraft[index].title || `Track ${index + 1}`;
      markDirty();
      schedulePreviewRefresh();
    });

    const controls = document.createElement("div");
    controls.className = "music-track-controls";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "btn-mini";
    upBtn.textContent = "Naik";
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => moveMusicTrack(index, -1));

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "btn-mini";
    downBtn.textContent = "Turun";
    downBtn.disabled = index === musicPlaylistDraft.length - 1;
    downBtn.addEventListener("click", () => moveMusicTrack(index, 1));

    const testLink = document.createElement("a");
    testLink.className = "btn-mini";
    testLink.href = track.url || track.sourceUrl || "#";
    testLink.target = "_blank";
    testLink.rel = "noopener noreferrer";
    testLink.textContent = "Tes";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-mini";
    removeBtn.textContent = "Hapus";
    removeBtn.addEventListener("click", () => {
      musicPlaylistDraft = musicPlaylistDraft.filter((_, itemIndex) => itemIndex !== index);
      syncBackgroundMusicField();
      renderMusicLibraryEditor();
      markDirty();
      schedulePreviewRefresh();
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(testLink);
    controls.appendChild(removeBtn);

    item.appendChild(head);
    item.appendChild(createLabeledInput("Judul Lagu", titleInput));
    item.appendChild(controls);
    musicLibraryEditor.appendChild(item);
  });
}

async function loadMusicLibrary(options = {}) {
  const markAsDirty = options.markAsDirty !== false;
  try {
    const adminKey = getAdminKeyOrThrow();
    setStatus(statusMusic, "Memuat library musik dari Drive...");
    const result = await postApi({
      action: "listMusicLibrary",
      adminKey
    });

    const existing = normalizeMusicPlaylist(musicPlaylistDraft, fields.backgroundMusicUrl.value.trim());
    const existingMap = new Map(existing.map((item) => [item.id || item.url, item]));
    const libraryTracks = normalizeMusicPlaylist(result.files || []);

    libraryTracks.forEach((track) => {
      const key = track.id || track.url;
      if (existingMap.has(key)) return;
      existing.push({ ...track, isActive: false });
    });

    musicPlaylistDraft = existing;
    renderMusicLibraryEditor();
    setStatus(statusMusic, `Library musik dimuat (${libraryTracks.length} file audio ditemukan).`);
    if (markAsDirty) {
      markDirty();
      schedulePreviewRefresh();
    }
  } catch (error) {
    setStatus(statusMusic, `Error: ${error.message}`);
  }
}

function normalizeBaseUrl(value) {
  const clean = (value || "").trim();
  if (!clean) return "";

  const withProtocol = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;

  try {
    const parsed = new URL(withProtocol, window.location.origin);
    let pathname = parsed.pathname || "/";

    pathname = pathname.replace(/\/admin\.html?$/i, "/");
    if (parsed.hostname && pathname.toLowerCase().includes(parsed.hostname.toLowerCase())) {
      pathname = pathname.replace(new RegExp(`/${parsed.hostname.replace(/\./g, "\\.")}/?`, "ig"), "/");
    }
    pathname = pathname.replace(/\/{2,}/g, "/");
    if (!pathname.endsWith("/")) pathname += "/";

    parsed.pathname = pathname;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    return clean.endsWith("/") ? clean : `${clean}/`;
  }
}

function parseWeddingIso(isoString) {
  const fallback = {
    localDateTime: "",
    offset: "+07:00"
  };

  const value = (isoString || "").trim();
  if (!value) return fallback;

  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(Z|[+\-]\d{2}:\d{2})?$/);
  if (!match) return fallback;

  return {
    localDateTime: `${match[1]}T${match[2]}`,
    offset: match[3] === "Z" ? "+00:00" : (match[3] || "+07:00")
  };
}

function buildWeddingIsoFromInputs() {
  const dateTime = fields.weddingDateTimeLocal.value.trim();
  const offset = fields.weddingTimeOffset.value || "+07:00";
  if (!dateTime) return "";
  return `${dateTime}:00${offset}`;
}

function updateWeddingIsoPreview() {
  fields.weddingDateISO.value = buildWeddingIsoFromInputs();
  if (!fields.eventStartDateTimeLocal.value && fields.weddingDateTimeLocal.value) {
    fields.eventStartDateTimeLocal.value = fields.weddingDateTimeLocal.value;
    fields.eventStartOffset.value = fields.weddingTimeOffset.value || "+07:00";
    updateEventStartIsoPreview();
  }
}

function buildEventStartIsoFromInputs() {
  const dateTime = fields.eventStartDateTimeLocal.value.trim();
  const offset = fields.eventStartOffset.value || "+07:00";
  if (!dateTime) return "";
  return `${dateTime}:00${offset}`;
}

function updateEventStartIsoPreview() {
  fields.eventStartISO.value = buildEventStartIsoFromInputs();
}

function normalizeBoolean(value, fallback = false) {
  return sharedNormalizeBoolean(value, fallback);
}

function getBankOptionByCode(code) {
  return sharedGetBankOptionByCode(code);
}

function getBankOptionByName(name) {
  return sharedGetBankOptionByName(name);
}

function getEwalletOptionByCode(code) {
  return sharedGetEwalletOptionByCode(code);
}

function getEwalletOptionByName(name) {
  return sharedGetEwalletOptionByName(name);
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

function inferGiftAccountType(account) {
  return sharedInferGiftAccountType(account);
}

function createDefaultGiftAccount(type = "bank") {
  return sharedCreateDefaultGiftAccount(type);
}

function normalizeGiftAccounts(input) {
  return sharedNormalizeGiftAccounts(input, { keepEmpty: true });
}

function suggestBankByAccountNumber(accountNumber) {
  const digits = String(accountNumber || "").replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.length === 13) return "mandiri";
  if (digits.length >= 14) return "bri";
  if (digits.length === 10 && digits.startsWith("0")) return "bca";
  if (digits.length === 10 && digits.startsWith("1")) return "bni";
  return null;
}

function renderGiftAccountsEditor(accounts) {
  if (!giftAccountsEditor) return;
  giftAccountsDraft = normalizeGiftAccounts(accounts);

  if (!giftAccountsDraft.length) {
    giftAccountsDraft = [createDefaultGiftAccount()];
  }

  giftAccountsEditor.innerHTML = "";
  giftAccountsDraft.forEach((account, index) => {
    const type = inferGiftAccountType(account);
    const item = document.createElement("article");
    item.className = "gift-account-editor-item";

    const head = document.createElement("div");
    head.className = "gift-account-editor-head";
    const title = document.createElement("p");
    title.className = "gift-account-editor-title";
    title.textContent = `Akun Gift ${index + 1}`;
    head.appendChild(title);
    item.appendChild(head);

    const categorySelect = document.createElement("select");
    categorySelect.setAttribute("data-role", "category");
    categorySelect.innerHTML = `
      <option value="bank">Transfer Bank</option>
      <option value="ewallet">E-Wallet</option>
    `;
    categorySelect.value = type;

    const bankSelect = document.createElement("select");
    bankSelect.setAttribute("data-role", "provider-code");
    bankSelect.value = account.providerCode || "";

    const bankNameInput = document.createElement("input");
    bankNameInput.setAttribute("data-role", "provider-name");
    bankNameInput.type = "text";
    bankNameInput.placeholder = "Nama Bank / E-Wallet";
    bankNameInput.value = account.providerName || "";

    const accountNumberInput = document.createElement("input");
    accountNumberInput.setAttribute("data-role", "account-number");
    accountNumberInput.type = "text";
    accountNumberInput.placeholder = "Nomor Rekening / Nomor HP";
    accountNumberInput.value = account.accountNumber || "";

    const accountHolderInput = document.createElement("input");
    accountHolderInput.setAttribute("data-role", "account-holder");
    accountHolderInput.type = "text";
    accountHolderInput.placeholder = "Nama Pemilik";
    accountHolderInput.value = account.accountHolder || "";

    const logoInput = document.createElement("input");
    logoInput.setAttribute("data-role", "logo-url");
    logoInput.type = "text";
    logoInput.placeholder = "URL Logo";
    logoInput.value = account.logoUrl || "";

    const activeWrap = document.createElement("label");
    activeWrap.className = "inline-check";
    const activeInput = document.createElement("input");
    activeInput.setAttribute("data-role", "is-active");
    activeInput.type = "checkbox";
    activeInput.checked = normalizeBoolean(account.isActive, true);
    const activeText = document.createElement("span");
    activeText.textContent = "Aktif Ditampilkan";
    activeWrap.appendChild(activeInput);
    activeWrap.appendChild(activeText);

    const controls = document.createElement("div");
    controls.className = "actions";

    const detectBtn = document.createElement("button");
    detectBtn.type = "button";
    detectBtn.className = "btn-mini";
    detectBtn.textContent = "Deteksi Bank";
    detectBtn.addEventListener("click", () => {
      const suggestion = suggestBankByAccountNumber(accountNumberInput.value);
      if (!suggestion) {
        setStatus(statusGift, "Bank tidak bisa dideteksi otomatis. Pilih manual.");
        return;
      }
      const bankMeta = getBankOptionByCode(suggestion);
      if (!bankMeta) return;
      bankSelect.value = bankMeta.code;
      bankNameInput.value = bankMeta.name;
      if (!logoInput.value.trim()) {
        logoInput.value = bankMeta.logoUrl;
      }
      setStatus(statusGift, `Bank terdeteksi: ${bankMeta.name} (silakan verifikasi).`);
      markDirty();
      schedulePreviewRefresh();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-mini";
    removeBtn.textContent = "Hapus Rekening";
    removeBtn.addEventListener("click", () => {
      const next = readGiftAccountsFromEditor();
      next.splice(index, 1);
      renderGiftAccountsEditor(next.length ? next : [createDefaultGiftAccount()]);
      setStatus(statusGift, "Akun gift dihapus dari editor. Klik Simpan agar permanen.");
      markDirty();
      schedulePreviewRefresh();
    });

    controls.appendChild(detectBtn);
    controls.appendChild(removeBtn);

    const categoryLabel = createLabeledInput("Jenis Akun", categorySelect);
    const providerSelectLabel = createLabeledInput("Bank", bankSelect);
    const providerNameLabel = createLabeledInput("Nama Bank", bankNameInput);
    const accountNumberLabel = createLabeledInput("Nomor Rekening", accountNumberInput);
    const accountHolderLabel = createLabeledInput("Nama Pemilik", accountHolderInput);
    const logoLabel = createLabeledInput("Logo (URL)", logoInput);

    function syncProviderOptions(nextType) {
      const options = nextType === "ewallet" ? EWALLET_OPTIONS : BANK_OPTIONS;
      const defaultLabel = nextType === "ewallet" ? "Pilih E-Wallet" : "Pilih Bank";
      bankSelect.innerHTML = `<option value="">${defaultLabel}</option>${options.map((opt) => `<option value="${opt.code}">${opt.name}</option>`).join("")}`;
    }

    function applyProviderMeta(nextType) {
      const selectedCode = String(bankSelect.value || "").trim().toLowerCase();
      const providerMeta = nextType === "ewallet"
        ? getEwalletOptionByCode(selectedCode)
        : getBankOptionByCode(selectedCode);
      if (!providerMeta) return;
      bankNameInput.value = providerMeta.name;
      if (!logoInput.value.trim() && providerMeta.logoUrl) {
        logoInput.value = providerMeta.logoUrl;
      }
    }

    function updateGiftFieldLabels(nextType) {
      const isEwallet = nextType === "ewallet";
      providerSelectLabel.firstChild.textContent = isEwallet ? "E-Wallet" : "Bank";
      providerNameLabel.firstChild.textContent = isEwallet ? "Nama E-Wallet" : "Nama Bank";
      accountNumberLabel.firstChild.textContent = isEwallet ? "Nomor E-Wallet" : "Nomor Rekening";
      logoLabel.firstChild.textContent = isEwallet ? "Logo E-Wallet (URL)" : "Logo Bank (URL)";
      accountNumberInput.placeholder = isEwallet ? "Nomor HP / ID E-Wallet" : "Nomor Rekening";
      bankNameInput.placeholder = isEwallet ? "Nama E-Wallet" : "Nama Bank";
      detectBtn.style.display = isEwallet ? "none" : "";
      syncProviderOptions(nextType);
    }

    bankSelect.addEventListener("change", () => {
      applyProviderMeta(categorySelect.value);
    });

    categorySelect.addEventListener("change", () => {
      bankSelect.value = "";
      bankNameInput.value = "";
      if (!logoInput.value.trim() || EWALLET_OPTIONS.some((opt) => opt.logoUrl === logoInput.value) || BANK_OPTIONS.some((opt) => opt.logoUrl === logoInput.value)) {
        logoInput.value = "";
      }
      updateGiftFieldLabels(categorySelect.value);
    });

    updateGiftFieldLabels(type);
    if (account.providerCode) {
      bankSelect.value = account.providerCode;
    }

    const wrap = document.createElement("div");
    wrap.className = "grid two";
    wrap.appendChild(categoryLabel);
    wrap.appendChild(providerSelectLabel);
    wrap.appendChild(providerNameLabel);
    wrap.appendChild(accountNumberLabel);
    wrap.appendChild(accountHolderLabel);
    wrap.appendChild(logoLabel);
    wrap.appendChild(activeWrap);

    item.appendChild(wrap);
    item.appendChild(controls);
    giftAccountsEditor.appendChild(item);
  });
}

function createLabeledInput(labelText, inputEl) {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.appendChild(inputEl);
  return label;
}

function readGiftAccountsFromEditor() {
  if (!giftAccountsEditor) return [];
  const items = Array.from(giftAccountsEditor.querySelectorAll(".gift-account-editor-item"));
  return items.map((item) => {
    const type = normalizeGiftType(item.querySelector('[data-role="category"]')?.value || "bank");
    const providerCode = String(item.querySelector('[data-role="provider-code"]')?.value || "").trim().toLowerCase();
    const providerName = String(item.querySelector('[data-role="provider-name"]')?.value || "").trim();
    const accountNumber = String(item.querySelector('[data-role="account-number"]')?.value || "").replace(/\D+/g, "");
    const accountHolder = String(item.querySelector('[data-role="account-holder"]')?.value || "").trim();
    const logoUrl = String(item.querySelector('[data-role="logo-url"]')?.value || "").trim();
    const isActive = Boolean(item.querySelector('[data-role="is-active"]')?.checked);
    return {
      type,
      category: type,
      providerCode,
      providerName,
      bankCode: providerCode,
      bankName: providerName,
      accountNumber,
      accountHolder,
      logoUrl,
      isActive
    };
  }).filter((item) => item.accountNumber);
}

function parseDateInput(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatHeroDatePlace(startDate, endDate, city) {
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const start = startDate;
  const end = endDate || startDate;
  const sameDay = (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );

  const location = String(city || "").trim();

  if (sameDay) {
    const line = `${dayNames[start.getDay()]}, ${start.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    return location ? `${line} • ${location}` : line;
  }

  const dayLine = `${dayNames[start.getDay()]} - ${dayNames[end.getDay()]}`;
  let dateLine = "";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    dateLine = `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  } else if (start.getFullYear() === end.getFullYear()) {
    dateLine = `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
  } else {
    dateLine = `${start.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }

  const line = `${dayLine}, ${dateLine}`;
  return location ? `${line} • ${location}` : line;
}

function generateHeroDatePlaceFromInputs() {
  const start = parseDateInput(fields.heroDateStart.value);
  if (!start) {
    setStatus(statusGallery, "Isi Tanggal Hero Mulai dulu.");
    return;
  }

  const endRaw = parseDateInput(fields.heroDateEnd.value);
  const end = endRaw && endRaw.getTime() >= start.getTime() ? endRaw : start;
  const result = formatHeroDatePlace(start, end, fields.heroDateCity.value);
  fields.heroDatePlace.value = result;
  const dateOnly = result.split("•")[0].trim();
  fields.resepsiDate.value = dateOnly;
  if (!fields.eventStartDateTimeLocal.value) {
    const yyyy = String(start.getFullYear());
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    fields.eventStartDateTimeLocal.value = `${yyyy}-${mm}-${dd}T08:00`;
    updateEventStartIsoPreview();
  }
  setStatus(statusGallery, "Tanggal hero berhasil digenerate.");
  markDirty();
  schedulePreviewRefresh();
}

function parseNonNegativeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(num);
}

function parseNonNegativeInteger(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "";
  return String(Math.floor(num));
}

function parsePositiveNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(num);
}

function normalizeGalleryMode(value) {
  return sharedNormalizeGalleryMode(value);
}

function normalizeGalleryStyle(value) {
  return sharedNormalizeGalleryStyle(value);
}

function normalizeThemeName(value) {
  return sharedNormalizeThemeName(value);
}

function clampPercent(value, fallback = 50) {
  return sharedClampPercent(value, fallback);
}

function normalizeGalleryPhotoFocusMap(input) {
  return sharedNormalizeGalleryPhotoFocusMap(input);
}

function getGalleryPhotoFocus(url) {
  const key = String(url || "").trim();
  const item = galleryPhotoFocusMap[key];
  if (!item) return { x: 50, y: 50 };
  return {
    x: clampPercent(item.x, 50),
    y: clampPercent(item.y, 50)
  };
}

function setGalleryPhotoFocus(url, x, y) {
  const key = String(url || "").trim();
  if (!key) return;
  galleryPhotoFocusMap[key] = {
    x: clampPercent(x, 50),
    y: clampPercent(y, 50)
  };
}

function updateGalleryModeFields() {
  const isCarousel = normalizeGalleryMode(fields.galleryMode.value) === "carousel";
  fields.galleryAutoplaySec.disabled = !isCarousel;
  if (isCarousel && !String(fields.galleryAutoplaySec.value || "").trim()) {
    fields.galleryAutoplaySec.value = "3.5";
  } else if (!isCarousel) {
    fields.galleryAutoplaySec.value = "";
  }
}

function decodeHtmlEntities(value) {
  const source = String(value || "");
  if (!source) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = source;
  return textarea.value;
}

function readConfigFromForm() {
  const allPhotos = getGalleryUrls();
  const photos = allPhotos.filter((url) => selectedGalleryUrls.has(url));
  const galleryPhotosToSave = photos.length ? photos : allPhotos;
  const sanitizedFocusMap = {};
  galleryPhotosToSave.forEach((url) => {
    const focus = getGalleryPhotoFocus(url);
    if (focus.x !== 50 || focus.y !== 50) {
      sanitizedFocusMap[url] = focus;
    }
  });
  const storyPhotos = fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const loveStoryItems = [1, 2, 3].map((index) => ({
    date: fields[`storyDate${index}`].value.trim(),
    title: fields[`storyTitle${index}`].value.trim(),
    description: fields[`storyDesc${index}`].value.trim()
  }));

  return {
    invitationBaseUrl: invitationBaseUrlInput.value.trim(),
    brandInitials: fields.brandInitials.value.trim(),
    seoTitle: fields.seoTitle.value.trim(),
    seoDescription: fields.seoDescription.value.trim(),
    themeName: normalizeThemeName(fields.themeName.value),
    heroOverline: fields.heroOverline.value.trim(),
    brideShortName: fields.brideShortName.value.trim(),
    groomShortName: fields.groomShortName.value.trim(),
    brideFullName: fields.brideFullName.value.trim(),
    groomFullName: fields.groomFullName.value.trim(),
    brideParents: fields.brideParents.value.trim(),
    groomParents: fields.groomParents.value.trim(),
    heroDatePlace: fields.heroDatePlace.value.trim(),
    heroBackgroundPhoto: fields.heroBackgroundPhoto.value.trim(),
    footerNames: fields.footerNames.value.trim(),
    backgroundMusicUrl: (musicPlaylistDraft.find((item) => item.isActive && item.url) || {}).url || fields.backgroundMusicUrl.value.trim(),
    musicPlaybackMode: normalizeMusicPlaybackMode(fields.musicPlaybackMode && fields.musicPlaybackMode.value),
    musicPlaylist: normalizeMusicPlaylist(musicPlaylistDraft, fields.backgroundMusicUrl.value.trim()),
    musicStartSec: parseNonNegativeNumber(fields.musicStartSec.value.trim()),
    musicLoopStartSec: parseNonNegativeNumber(fields.musicLoopStartSec.value.trim()),
    musicLoopEndSec: parseNonNegativeNumber(fields.musicLoopEndSec.value.trim()),
    weddingDateISO: buildWeddingIsoFromInputs(),
    eventStartISO: buildEventStartIsoFromInputs(),
    akad: {
      date: fields.akadDate.value.trim(),
      time: fields.akadTime.value.trim(),
      venue: fields.akadVenue.value.trim(),
      mapUrl: fields.akadMapUrl.value.trim()
    },
    resepsi: {
      date: fields.resepsiDate.value.trim(),
      time: fields.resepsiTime.value.trim(),
      venue: fields.resepsiVenue.value.trim(),
      mapUrl: fields.resepsiMapUrl.value.trim()
    },
    quranVerseArabic: fields.quranVerseArabic.value.trim(),
    quranVerseTranslation: fields.quranVerseTranslation.value.trim(),
    quranVerseReference: fields.quranVerseReference.value.trim(),
    hadithText: fields.hadithText.value.trim(),
    hadithReference: fields.hadithReference.value.trim(),
    marriageDoaText: fields.marriageDoaText.value.trim(),
    marriageDoaReference: fields.marriageDoaReference.value.trim(),
    loveStoryItems,
    loveStoryPhotos: storyPhotos,
    galleryPhotos: galleryPhotosToSave,
    galleryMode: normalizeGalleryMode(fields.galleryMode.value),
    galleryMaxItems: parseNonNegativeInteger(fields.galleryMaxItems.value.trim()),
    galleryAutoplaySec: parsePositiveNumber(fields.galleryAutoplaySec.value.trim()),
    galleryStyle: normalizeGalleryStyle(fields.galleryStyle.value),
    galleryPhotoFocus: sanitizedFocusMap,
    giftEnabled: Boolean(fields.giftEnabled && fields.giftEnabled.checked),
    giftSectionTitle: fields.giftSectionTitle.value.trim(),
    giftSectionSubtitle: fields.giftSectionSubtitle.value.trim(),
    giftAccounts: readGiftAccountsFromEditor()
  };
}

function validateConfigBeforeSave(config) {
  const errors = [];
  if (!String(config.invitationBaseUrl || "").trim()) errors.push("Base URL undangan wajib diisi.");
  if (!String(config.brideShortName || "").trim()) errors.push("Nama pendek mempelai wanita wajib diisi.");
  if (!String(config.groomShortName || "").trim()) errors.push("Nama pendek mempelai pria wajib diisi.");
  if (!String(config.brideFullName || "").trim()) errors.push("Nama lengkap mempelai wanita wajib diisi.");
  if (!String(config.groomFullName || "").trim()) errors.push("Nama lengkap mempelai pria wajib diisi.");
  if (!String(config.heroDatePlace || "").trim()) errors.push("Tanggal & lokasi hero wajib diisi.");
  if (!String(config.eventStartISO || config.weddingDateISO || "").trim()) errors.push("Tanggal acara utama wajib diisi.");

  if (config.giftEnabled) {
    const activeGiftAccounts = normalizeGiftAccounts(config.giftAccounts).filter((item) => item.isActive && item.accountNumber);
    if (!activeGiftAccounts.length) {
      errors.push("Section Gift aktif, tapi belum ada akun gift aktif yang bernomor.");
    }
  }

  const loopStart = Number(config.musicLoopStartSec || 0);
  const loopEnd = Number(config.musicLoopEndSec || 0);
  if (loopStart && loopEnd && loopEnd <= loopStart) {
    errors.push("Loop musik selesai harus lebih besar dari detik mulai.");
  }

  return errors;
}

function cleanPhotoArray(input) {
  return sharedCleanPhotoArray(input);
}

function healMisplacedPhotoConfig(config) {
  const source = (config && typeof config === "object") ? config : {};
  const storyRaw = cleanPhotoArray(source.loveStoryPhotos);
  const galleryRaw = cleanPhotoArray(source.galleryPhotos);
  const defaultStory = cleanPhotoArray((ADMIN_WEDDING_CONFIG && ADMIN_WEDDING_CONFIG.loveStoryPhotos) || []).slice(0, 3);

  const likelyShiftedColumn = galleryRaw.length === 0 && storyRaw.length > 3;
  if (!likelyShiftedColumn) return source;

  return {
    ...source,
    loveStoryPhotos: defaultStory.length ? defaultStory : storyRaw.slice(0, 3),
    galleryPhotos: storyRaw
  };
}

function fillForm(config) {
  isHydratingForm = true;
  const safeConfig = healMisplacedPhotoConfig(config || {});
  if (safeConfig.invitationBaseUrl) {
    applyInvitationBaseUrl(safeConfig.invitationBaseUrl);
  }
  galleryPhotoFocusMap = normalizeGalleryPhotoFocusMap(
    safeConfig.galleryPhotoFocus || (ADMIN_WEDDING_CONFIG && ADMIN_WEDDING_CONFIG.galleryPhotoFocus) || {}
  );

  fields.brandInitials.value = safeConfig.brandInitials || "";
  fields.seoTitle.value = safeConfig.seoTitle || "";
  fields.seoDescription.value = safeConfig.seoDescription || "";
  fields.themeName.value = normalizeThemeName(safeConfig.themeName || ADMIN_WEDDING_CONFIG.themeName || "botanical");
  fields.heroOverline.value = safeConfig.heroOverline || "";
  fields.brideShortName.value = safeConfig.brideShortName || "";
  fields.groomShortName.value = safeConfig.groomShortName || "";
  fields.brideFullName.value = safeConfig.brideFullName || "";
  fields.groomFullName.value = safeConfig.groomFullName || "";
  fields.brideParents.value = safeConfig.brideParents || "";
  fields.groomParents.value = safeConfig.groomParents || "";
  fields.heroDatePlace.value = safeConfig.heroDatePlace || "";
  fields.heroDateCity.value = String(safeConfig.heroDatePlace || "").split("•")[1]?.trim() || "";
  fields.heroDateStart.value = "";
  fields.heroDateEnd.value = "";
  fields.heroBackgroundPhoto.value = safeConfig.heroBackgroundPhoto || "";
  fields.footerNames.value = safeConfig.footerNames || "";
  fields.backgroundMusicUrl.value = safeConfig.backgroundMusicUrl || "";
  if (fields.musicPlaybackMode) {
    fields.musicPlaybackMode.value = normalizeMusicPlaybackMode(safeConfig.musicPlaybackMode || "ordered");
  }
  fields.musicStartSec.value = safeConfig.musicStartSec || "";
  fields.musicLoopStartSec.value = safeConfig.musicLoopStartSec || "";
  fields.musicLoopEndSec.value = safeConfig.musicLoopEndSec || "";
  musicPlaylistDraft = normalizeMusicPlaylist(safeConfig.musicPlaylist, safeConfig.backgroundMusicUrl || fields.backgroundMusicUrl.value.trim());
  renderMusicLibraryEditor();

  const parsedWeddingDate = parseWeddingIso(safeConfig.weddingDateISO || "");
  fields.weddingDateTimeLocal.value = parsedWeddingDate.localDateTime;
  fields.weddingTimeOffset.value = parsedWeddingDate.offset;
  updateWeddingIsoPreview();

  const parsedEventStartDate = parseWeddingIso(safeConfig.eventStartISO || safeConfig.weddingDateISO || "");
  fields.eventStartDateTimeLocal.value = parsedEventStartDate.localDateTime;
  fields.eventStartOffset.value = parsedEventStartDate.offset;
  updateEventStartIsoPreview();

  fields.akadDate.value = (safeConfig.akad && safeConfig.akad.date) || "";
  fields.akadTime.value = (safeConfig.akad && safeConfig.akad.time) || "";
  fields.akadVenue.value = (safeConfig.akad && safeConfig.akad.venue) || "";
  fields.akadMapUrl.value = (safeConfig.akad && safeConfig.akad.mapUrl) || "";

  fields.resepsiDate.value = (safeConfig.resepsi && safeConfig.resepsi.date) || "";
  fields.resepsiTime.value = (safeConfig.resepsi && safeConfig.resepsi.time) || "";
  fields.resepsiVenue.value = (safeConfig.resepsi && safeConfig.resepsi.venue) || "";
  fields.resepsiMapUrl.value = (safeConfig.resepsi && safeConfig.resepsi.mapUrl) || "";
  fields.quranVerseArabic.value = decodeHtmlEntities(safeConfig.quranVerseArabic || "");
  fields.quranVerseTranslation.value = safeConfig.quranVerseTranslation || "";
  fields.quranVerseReference.value = safeConfig.quranVerseReference || "";
  fields.hadithText.value = safeConfig.hadithText || "";
  fields.hadithReference.value = safeConfig.hadithReference || "";
  fields.marriageDoaText.value = safeConfig.marriageDoaText || "";
  fields.marriageDoaReference.value = safeConfig.marriageDoaReference || "";
  const fallbackStoryItems = Array.isArray(ADMIN_WEDDING_CONFIG.loveStoryItems) ? ADMIN_WEDDING_CONFIG.loveStoryItems : [];
  const storyItems = Array.isArray(safeConfig.loveStoryItems) && safeConfig.loveStoryItems.length
    ? safeConfig.loveStoryItems
    : fallbackStoryItems;
  [1, 2, 3].forEach((index) => {
    const item = storyItems[index - 1] || {};
    fields[`storyDate${index}`].value = String(item.date || "");
    fields[`storyTitle${index}`].value = String(item.title || "");
    fields[`storyDesc${index}`].value = String(item.description || "");
  });

  fields.loveStoryPhotos.value = Array.isArray(safeConfig.loveStoryPhotos) ? safeConfig.loveStoryPhotos.slice(0, 3).join("\n") : "";
  fields.galleryPhotos.value = Array.isArray(safeConfig.galleryPhotos) ? safeConfig.galleryPhotos.join("\n") : "";
  syncSelectedGalleryUrls(getGalleryUrls());
  fields.galleryMode.value = normalizeGalleryMode(safeConfig.galleryMode || (ADMIN_WEDDING_CONFIG.galleryMode || "grid"));
  fields.galleryMaxItems.value = safeConfig.galleryMaxItems || "";
  fields.galleryAutoplaySec.value = safeConfig.galleryAutoplaySec || "";
  fields.galleryStyle.value = normalizeGalleryStyle(safeConfig.galleryStyle || (ADMIN_WEDDING_CONFIG.galleryStyle || "elegant"));
  fields.giftEnabled.checked = normalizeBoolean(safeConfig.giftEnabled, normalizeBoolean(ADMIN_WEDDING_CONFIG.giftEnabled, false));
  fields.giftSectionTitle.value = String(safeConfig.giftSectionTitle || ADMIN_WEDDING_CONFIG.giftSectionTitle || "Wedding Gift");
  fields.giftSectionSubtitle.value = String(
    safeConfig.giftSectionSubtitle || ADMIN_WEDDING_CONFIG.giftSectionSubtitle || "Doa restu Anda adalah hadiah terindah."
  );
  renderGiftAccountsEditor(
    normalizeGiftAccounts(
      safeConfig.giftAccounts !== undefined ? safeConfig.giftAccounts : (ADMIN_WEDDING_CONFIG.giftAccounts || [])
    )
  );
  updateGalleryModeFields();
  renderGalleryPreview();
  writePreviewDraftToStorage();
  isHydratingForm = false;
}

async function postApi(payload) {
  return adminApiClient.postApi(payload);
}

guestAdminModule = window.WeddingGuestAdminModule.createGuestAdminModule({
  elements: {
    guestInput,
    guestSearch,
    guestGroupFilter,
    guestStatusFilter,
    guestPageSize,
    guestPageInfo,
    btnGuestPrev,
    btnGuestNext,
    guestLinks,
    guestTableBody,
    invitationBaseUrlInput,
    statusGuests
  },
  getAdminKeyOrThrow,
  setStatus,
  postApi,
  normalizeBaseUrl
});

rsvpAdminModule = window.WeddingRsvpAdminModule.createRsvpAdminModule({
  elements: {
    rsvpSearch,
    rsvpKehadiranFilter,
    rsvpPageSize,
    rsvpPageInfo,
    btnRsvpPrev,
    btnRsvpNext,
    rsvpTableBody,
    statusRsvps
  },
  getAdminKeyOrThrow,
  setStatus,
  postApi,
  rsvpApiUrl: ADMIN_RSVP_API_URL
});

async function loadConfigFromServer(options = {}) {
  const promptBeforeOverwrite = options.promptBeforeOverwrite !== false;
  const clearDraftAfterLoad = options.clearDraftAfterLoad !== false;
  try {
    if (promptBeforeOverwrite && isDirty && !window.confirm("Ada perubahan lokal yang belum disimpan. Muat dari server dan timpa form sekarang?")) {
      return;
    }
    if (promptBeforeOverwrite && !isDirty && pendingLocalDraft && !window.confirm("Ada draft lokal yang belum dipulihkan. Muat dari server dan buang draft lokal?")) {
      return;
    }
    if (!ADMIN_RSVP_API_URL || ADMIN_RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
      throw new Error("Isi RSVP_API_URL di config.js terlebih dahulu");
    }

    setStatus(statusConfig, "Memuat konfigurasi...");
    const config = await adminApiClient.getConfig();
    fillForm(config);
    setStatus(statusConfig, "Konfigurasi berhasil dimuat");
    markClean(clearDraftAfterLoad);
    showToast("Config dimuat", "Data terbaru dari server sudah masuk ke form.", "success");
    schedulePreviewRefresh();
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
    showToast("Gagal memuat config", error.message, "error");
  }
}

async function saveConfigToServer() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const config = readConfigFromForm();
    const validationErrors = validateConfigBeforeSave(config);
    if (validationErrors.length) {
      const message = validationErrors.slice(0, 3).join(" ");
      setStatus(statusConfig, `Validasi gagal: ${message}`);
      showToast("Validasi belum lolos", validationErrors[0], "error");
      return;
    }

    setStatus(statusConfig, "Menyimpan konfigurasi...");
    await postApi({
      action: "saveConfig",
      adminKey,
      config
    });

    setStatus(statusConfig, "Konfigurasi berhasil disimpan");
    markClean();
    showToast("Config tersimpan", "Perubahan sudah dikirim ke server.", "success");
    writePreviewDraftToStorage();
    schedulePreviewRefresh();
  } catch (error) {
    setStatus(statusConfig, `Error: ${error.message}`);
    showToast("Gagal menyimpan", error.message, "error");
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const parts = result.split(",");
      if (parts.length < 2) {
        reject(new Error(`Format file tidak valid: ${file.name}`));
        return;
      }
      resolve(parts[1]);
    };
    reader.onerror = () => reject(new Error(`Gagal membaca file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function appendGalleryUrls(urls) {
  const existing = getGalleryUrls();

  const unique = new Set(existing);
  urls.forEach((url) => {
    if (url) {
      unique.add(url);
      selectedGalleryUrls.add(url);
    }
  });

  fields.galleryPhotos.value = Array.from(unique).join("\n");
  renderGalleryPreview();
}

function getLoveStoryUrls() {
  return fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function setLoveStoryUrls(urls) {
  const clean = Array.isArray(urls) ? urls.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3) : [];
  fields.loveStoryPhotos.value = clean.join("\n");
  renderLoveStoryPreview();
}

function setHeroFromGallery(url) {
  const target = String(url || "").trim();
  if (!target) return false;
  fields.heroBackgroundPhoto.value = target;
  return true;
}

function appendOneLoveStoryUrl(url) {
  const target = String(url || "").trim();
  if (!target) return false;
  const current = getLoveStoryUrls();
  if (current.includes(target)) return false;
  if (current.length >= 3) return false;
  current.push(target);
  setLoveStoryUrls(current);
  return true;
}

function fillLoveStoryFromGallery() {
  const galleryUrls = getGalleryUrls();
  if (!galleryUrls.length) return 0;
  const merged = [];
  galleryUrls.forEach((url) => {
    if (merged.length < 3) merged.push(url);
  });
  setLoveStoryUrls(merged);
  return merged.length;
}

function removeGalleryUrls(urls) {
  const targets = new Set(
    (urls || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );

  const existing = getGalleryUrls();

  const filtered = existing.filter((url) => !targets.has(url));
  targets.forEach((url) => selectedGalleryUrls.delete(url));
  targets.forEach((url) => {
    const key = String(url || "").trim();
    if (!key) return;
    delete galleryPhotoFocusMap[key];
  });
  fields.galleryPhotos.value = filtered.join("\n");
  renderGalleryPreview();
}

function getGalleryUrls() {
  return fields.galleryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncSelectedGalleryUrls(urls) {
  const available = Array.isArray(urls) ? urls : [];
  if (!selectedGalleryUrls.size) {
    selectedGalleryUrls = new Set(available);
    return;
  }

  const next = new Set();
  available.forEach((url) => {
    if (selectedGalleryUrls.has(url)) next.add(url);
  });

  if (!next.size && available.length) {
    available.forEach((url) => next.add(url));
  }

  selectedGalleryUrls = next;
}

function applySelectedGalleryUrls() {
  const allUrls = getGalleryUrls();
  const selected = allUrls.filter((url) => selectedGalleryUrls.has(url));
  const finalUrls = selected.length ? selected : allUrls;
  const nextFocusMap = {};
  finalUrls.forEach((url) => {
    const focus = galleryPhotoFocusMap[String(url || "").trim()];
    if (focus) nextFocusMap[String(url || "").trim()] = focus;
  });
  galleryPhotoFocusMap = nextFocusMap;
  fields.galleryPhotos.value = finalUrls.join("\n");
  syncSelectedGalleryUrls(finalUrls);
  renderGalleryPreview();
  setStatus(statusGallery, `${finalUrls.length} foto dipilih untuk ditampilkan di galeri.`);
  markDirty();
  schedulePreviewRefresh();
}

function getDrivePreviewCandidates(fileId) {
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w1200`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    `https://drive.google.com/uc?export=view&id=${fileId}`
  ];
}

function getPreviewCandidates(url) {
  const clean = String(url || "").trim();
  if (!clean) return [];

  const fileId = extractDriveFileId(clean);
  if (clean.includes("drive.google.com") && fileId) {
    return getDrivePreviewCandidates(fileId);
  }

  return [clean];
}

function applyPreviewImageWithFallback(img, rawUrl) {
  if (!img) return;

  const candidates = getPreviewCandidates(rawUrl);
  if (!candidates.length) {
    img.removeAttribute("src");
    return;
  }

  let index = 0;
  const applyNext = () => {
    const next = String(candidates[index] || "").trim();
    if (!next) {
      img.onerror = null;
      return;
    }
    index += 1;
    img.src = next;
  };

  img.onerror = () => {
    if (index >= candidates.length) {
      img.onerror = null;
      return;
    }
    applyNext();
  };

  applyNext();
}

function getLoveStoryPreviewUrls() {
  return fields.loveStoryPhotos.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function renderLoveStoryPreview() {
  if (!loveStoryPreview) return;

  const urls = getLoveStoryPreviewUrls();
  loveStoryPreview.innerHTML = "";

  if (!urls.length) {
    const empty = document.createElement("p");
    empty.className = "preview-empty";
    empty.textContent = "Preview foto Love Story akan muncul di sini.";
    loveStoryPreview.appendChild(empty);
    return;
  }

  urls.forEach((url, index) => {
    const item = document.createElement("article");
    item.className = "story-preview-item";

    const img = document.createElement("img");
    img.alt = `Preview Love Story ${index + 1}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    applyPreviewImageWithFallback(img, url);

    item.appendChild(img);
    loveStoryPreview.appendChild(item);
  });
}

async function deleteSinglePhoto(url) {
  const targetUrl = String(url || "").trim();
  if (!targetUrl) return;

  const alsoDeleteDrive = Boolean(deleteFromDriveInput && deleteFromDriveInput.checked);
  const confirmText = alsoDeleteDrive
    ? "Hapus foto ini dari galeri dan Google Drive?"
    : "Hapus foto ini dari galeri undangan?";
  if (!window.confirm(confirmText)) return;

  try {
    const adminKey = getAdminKeyOrThrow();
    setStatus(statusGallery, "Menghapus foto...");

    if (alsoDeleteDrive) {
      const result = await postApi({
        action: "deletePhotos",
        adminKey,
        urls: [targetUrl]
      });
      if (Number(result.deletedCount || 0) < 1) {
        const reason = result.failed && result.failed[0] && result.failed[0].reason;
        throw new Error(reason || "Gagal menghapus file dari Google Drive");
      }
    }

    removeGalleryUrls([targetUrl]);
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    setStatus(statusGallery, alsoDeleteDrive
      ? "Foto berhasil dihapus dari Drive dan galeri."
      : "Foto berhasil dihapus dari galeri.");
    markClean();
    showToast("Foto dihapus", "Konfigurasi galeri sudah otomatis disimpan.", "success");
  } catch (error) {
    setStatus(statusGallery, `Error: ${error.message}`);
    showToast("Gagal hapus foto", error.message, "error");
  }
}

function renderGalleryPreview() {
  if (!galleryPreview) return;
  const urls = getGalleryUrls();
  syncSelectedGalleryUrls(urls);

  galleryPreview.innerHTML = "";
  if (!urls.length) {
    const empty = document.createElement("p");
    empty.className = "preview-empty";
    empty.textContent = "Belum ada foto di galeri.";
    galleryPreview.appendChild(empty);
    return;
  }

  urls.forEach((url) => {
    const card = document.createElement("article");
    card.className = "gallery-item";

    const img = document.createElement("img");
    const focus = getGalleryPhotoFocus(url);
    img.style.objectPosition = `${focus.x}% ${focus.y}%`;
    img.alt = "Preview foto galeri";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    applyPreviewImageWithFallback(img, url);

    const body = document.createElement("div");
    body.className = "gallery-item-body";

    const urlText = document.createElement("p");
    urlText.className = "gallery-item-url";
    urlText.textContent = url;

    const selectWrap = document.createElement("label");
    selectWrap.className = "gallery-item-select";
    const selectInput = document.createElement("input");
    selectInput.type = "checkbox";
    selectInput.checked = selectedGalleryUrls.has(url);
    selectInput.addEventListener("change", () => {
      if (selectInput.checked) {
        selectedGalleryUrls.add(url);
      } else {
        selectedGalleryUrls.delete(url);
      }
    });
    const selectText = document.createElement("span");
    selectText.textContent = "Tampilkan di undangan";
    selectWrap.appendChild(selectInput);
    selectWrap.appendChild(selectText);

    const actions = document.createElement("div");
    actions.className = "gallery-item-actions";

    const heroBtn = document.createElement("button");
    heroBtn.type = "button";
    heroBtn.className = "btn-mini";
    heroBtn.textContent = "Set Hero";
    heroBtn.addEventListener("click", () => {
      if (setHeroFromGallery(url)) {
        setStatus(statusGallery, "Foto dipilih untuk background hero.");
        markDirty();
        schedulePreviewRefresh();
      }
    });

    const storyBtn = document.createElement("button");
    storyBtn.type = "button";
    storyBtn.className = "btn-mini";
    storyBtn.textContent = "Set Love Story";
    storyBtn.addEventListener("click", () => {
      const ok = appendOneLoveStoryUrl(url);
      if (ok) {
        setStatus(statusGallery, "Foto ditambahkan ke Love Story.");
        markDirty();
        schedulePreviewRefresh();
      } else {
        setStatus(statusGallery, "Love Story sudah penuh (maksimal 3) atau foto sudah ada.");
      }
    });

    const editPosBtn = document.createElement("button");
    editPosBtn.type = "button";
    editPosBtn.className = "btn-mini";
    editPosBtn.textContent = "Edit Posisi";
    editPosBtn.addEventListener("click", () => {
      const current = getGalleryPhotoFocus(url);
      const input = window.prompt(
        "Atur posisi foto (X,Y) 0-100. Contoh: 50,35",
        `${current.x},${current.y}`
      );
      if (input === null) return;
      const parts = String(input).split(",").map((item) => item.trim());
      if (parts.length !== 2) {
        setStatus(statusGallery, "Format posisi harus X,Y. Contoh: 50,35");
        return;
      }
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        setStatus(statusGallery, "Nilai posisi harus angka 0 sampai 100.");
        return;
      }
      setGalleryPhotoFocus(url, x, y);
      const next = getGalleryPhotoFocus(url);
      img.style.objectPosition = `${next.x}% ${next.y}%`;
      setStatus(statusGallery, `Posisi foto diatur ke X:${next.x}% Y:${next.y}%. Klik Simpan Konfigurasi untuk permanen.`);
      markDirty();
      schedulePreviewRefresh();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-mini";
    removeBtn.textContent = "Hapus Foto";
    removeBtn.addEventListener("click", () => {
      deleteSinglePhoto(url);
    });

    actions.appendChild(heroBtn);
    actions.appendChild(storyBtn);
    actions.appendChild(editPosBtn);
    actions.appendChild(removeBtn);

    body.appendChild(selectWrap);
    body.appendChild(urlText);
    body.appendChild(actions);
    card.appendChild(img);
    card.appendChild(body);
    galleryPreview.appendChild(card);
  });
}

async function uploadPhotosToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const files = Array.from(photoFilesInput.files || []);
    if (!files.length) throw new Error("Pilih minimal 1 foto dulu");

    const tooLarge = files.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) throw new Error(`Ukuran file maksimal 8MB per foto. Terlalu besar: ${tooLarge.name}`);

    setStatus(statusGallery, `Mengupload ${files.length} foto...`);

    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }))
    );

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: payloadFiles
    });

    const uploadedUrls = (result.files || []).map((item) => item.publicUrl).filter(Boolean);
    appendGalleryUrls(uploadedUrls);

    let autoHero = false;
    let autoStoryCount = 0;

    if (!fields.heroBackgroundPhoto.value.trim() && uploadedUrls[0]) {
      fields.heroBackgroundPhoto.value = uploadedUrls[0];
      autoHero = true;
    }

    const currentStory = getLoveStoryUrls();
    if (currentStory.length < 3 && uploadedUrls.length) {
      const mergedStory = [...currentStory];
      uploadedUrls.forEach((url) => {
        if (mergedStory.length >= 3) return;
        if (!mergedStory.includes(url)) mergedStory.push(url);
      });
      autoStoryCount = Math.max(mergedStory.length - currentStory.length, 0);
      setLoveStoryUrls(mergedStory);
    }

    // Auto-save config setelah upload agar galeri publik langsung ikut update.
    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    photoFilesInput.value = "";
    const autoNotes = [];
    if (autoHero) autoNotes.push("Hero background terisi otomatis");
    if (autoStoryCount > 0) autoNotes.push(`Love Story +${autoStoryCount} foto`);
    const tail = autoNotes.length ? ` (${autoNotes.join(", ")})` : "";
    setStatus(statusGallery, `${uploadedUrls.length} foto berhasil diupload dan konfigurasi galeri otomatis disimpan${tail}`);
    markClean();
    showToast("Foto terupload", "Galeri dan konfigurasi sudah otomatis disimpan.", "success");
  } catch (error) {
    setStatus(statusGallery, `Error: ${error.message}`);
    showToast("Upload foto gagal", error.message, "error");
  }
}

async function uploadHeroPhotoToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const file = (heroPhotoFileInput && heroPhotoFileInput.files && heroPhotoFileInput.files[0]) || null;
    if (!file) throw new Error("Pilih 1 foto hero dulu");
    if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran file hero maksimal 8MB");

    setStatus(statusGallery, "Mengupload foto hero...");

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: [{
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }]
    });

    const uploadedUrl = (result.files && result.files[0] && result.files[0].publicUrl) || "";
    if (!uploadedUrl) throw new Error("URL foto hero dari server kosong");

    fields.heroBackgroundPhoto.value = uploadedUrl;
    appendGalleryUrls([uploadedUrl]);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    if (heroPhotoFileInput) heroPhotoFileInput.value = "";
    setStatus(statusGallery, "Foto hero berhasil diupload, diset, dan disimpan.");
    markClean();
    showToast("Foto hero tersimpan", "Hero sudah memakai foto baru.", "success");
  } catch (error) {
    setStatus(statusGallery, `Error: ${error.message}`);
    showToast("Upload hero gagal", error.message, "error");
  }
}

async function uploadLoveStoryPhotosToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const files = Array.from((loveStoryPhotoFilesInput && loveStoryPhotoFilesInput.files) || []);
    if (!files.length) throw new Error("Pilih foto love story dulu");
    if (files.length > 3) throw new Error("Maksimal upload 3 foto love story");

    const tooLarge = files.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) throw new Error(`Ukuran file maksimal 8MB per foto. Terlalu besar: ${tooLarge.name}`);

    setStatus(statusGallery, `Mengupload ${files.length} foto love story...`);

    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: await fileToBase64(file)
      }))
    );

    const result = await postApi({
      action: "uploadPhotos",
      adminKey,
      files: payloadFiles
    });

    const uploadedUrls = (result.files || []).map((item) => item.publicUrl).filter(Boolean).slice(0, 3);
    if (!uploadedUrls.length) throw new Error("URL foto love story dari server kosong");

    setLoveStoryUrls(uploadedUrls);
    appendGalleryUrls(uploadedUrls);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    if (loveStoryPhotoFilesInput) loveStoryPhotoFilesInput.value = "";
    setStatus(statusGallery, `${uploadedUrls.length} foto love story berhasil diupload, diset, dan disimpan.`);
    markClean();
    showToast("Love Story tersimpan", "Foto love story baru sudah disimpan.", "success");
  } catch (error) {
    setStatus(statusGallery, `Error: ${error.message}`);
    showToast("Upload love story gagal", error.message, "error");
  }
}

async function deletePhotosFromDriveAndGallery() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const targetUrls = deletePhotoUrlsInput.value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!targetUrls.length) throw new Error("Isi minimal 1 URL foto yang ingin dihapus");

    setStatus(statusGallery, `Menghapus ${targetUrls.length} foto dari Drive...`);
    const result = await postApi({
      action: "deletePhotos",
      adminKey,
      urls: targetUrls
    });

    removeGalleryUrls(targetUrls);

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    deletePhotoUrlsInput.value = "";
    const deletedCount = Number(result.deletedCount || 0);
    const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
    if (failedCount > 0) {
      setStatus(statusGallery, `${deletedCount} foto dihapus. ${failedCount} foto gagal dihapus (cek izin/link).`);
      showToast("Hapus foto sebagian", `${failedCount} foto gagal dihapus.`, "error");
    } else {
      setStatus(statusGallery, `${deletedCount} foto berhasil dihapus dari Drive dan galeri.`);
      showToast("Foto dihapus", "Konfigurasi galeri sudah otomatis disimpan.", "success");
    }
    markClean();
  } catch (error) {
    setStatus(statusGallery, `Error: ${error.message}`);
    showToast("Hapus foto gagal", error.message, "error");
  }
}

async function uploadMusicToDrive() {
  try {
    const adminKey = getAdminKeyOrThrow();
    const file = (musicFileInput.files || [])[0];
    if (!file) throw new Error("Pilih 1 file musik dulu");

    const allowedAudio = /^audio\//.test(file.type || "");
    if (!allowedAudio) throw new Error("File harus format audio (mp3/m4a/wav, dll)");
    if (file.size > 15 * 1024 * 1024) throw new Error("Ukuran file musik maksimal 15MB");

    setStatus(statusMusic, "Mengupload musik...");

    const result = await postApi({
      action: "uploadMusic",
      adminKey,
      file: {
        name: file.name,
        mimeType: file.type || "audio/mpeg",
        contentBase64: await fileToBase64(file)
      }
    });

    const uploadedUrl = buildMusicProxyUrl(result.file) || (
      result.file &&
      (
        result.file.audioStreamUrl ||
        result.file.downloadUrl ||
        result.file.publicUrl
      )
    ) || "";
    if (!uploadedUrl) throw new Error("URL musik dari server kosong");

    fields.backgroundMusicUrl.value = uploadedUrl;
    const uploadedTrack = normalizeMusicTrack({
      ...(result.file || {}),
      title: (result.file && result.file.name) || file.name,
      url: uploadedUrl,
      isActive: true
    }, musicPlaylistDraft.length);
    musicPlaylistDraft = musicPlaylistDraft.map((item) => ({ ...item, isActive: false }));
    musicPlaylistDraft.unshift(uploadedTrack);
    renderMusicLibraryEditor();

    await postApi({
      action: "saveConfig",
      adminKey,
      config: readConfigFromForm()
    });

    musicFileInput.value = "";
    setStatus(statusMusic, "Musik berhasil diupload dan konfigurasi tersimpan");
    markClean();
    showToast("Musik tersimpan", "Playlist dan konfigurasi sudah diperbarui.", "success");
  } catch (error) {
    setStatus(statusMusic, `Error: ${error.message}`);
    showToast("Upload musik gagal", error.message, "error");
  }
}

function refreshGuestViews() {
  if (guestAdminModule) {
    guestAdminModule.refreshViews();
  }
}

function exportGuestsCsv() {
  if (guestAdminModule) {
    guestAdminModule.exportGuestsCsv();
  }
}

async function importGuests() {
  if (guestAdminModule) {
    await guestAdminModule.importGuests();
  }
}

async function loadGuests() {
  if (guestAdminModule) {
    await guestAdminModule.loadGuests();
  }
}

function refreshRsvpViews() {
  if (rsvpAdminModule) {
    rsvpAdminModule.refreshViews();
  }
}

async function loadRsvps() {
  if (rsvpAdminModule) {
    await rsvpAdminModule.loadRsvps();
  }
}

if (!ADMIN_RSVP_API_URL || ADMIN_RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  setStatus(statusConn, "Isi RSVP_API_URL di config.js agar admin panel aktif.");
} else {
  setStatus(statusConn, "Terhubung. Konfigurasi server akan dimuat otomatis.");
}

fillForm(ADMIN_WEDDING_CONFIG);
loadSavedAdminKey();
loadSavedInvitationBaseUrl();
renderGalleryPreview();
renderLoveStoryPreview();
writePreviewDraftToStorage();
markClean(false);

const savedLocalDraft = readLocalDraft();
if (savedLocalDraft) {
  showDraftRestoreBanner(savedLocalDraft);
}

if (btnPreviewToggle) {
  btnPreviewToggle.addEventListener("click", () => {
    togglePreviewPanel();
  });
}
if (btnPreviewRefresh) {
  btnPreviewRefresh.addEventListener("click", () => {
    refreshPreviewFrame(true);
  });
}
if (btnScrollTop) {
  btnScrollTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
if (btnRestoreDraft) {
  btnRestoreDraft.addEventListener("click", () => {
    if (!pendingLocalDraft || !pendingLocalDraft.data) return;
    fillForm(pendingLocalDraft.data);
    isDirty = true;
    updateDirtyStateLabel();
    writePreviewDraftToStorage();
    schedulePreviewRefresh();
    if (draftRestoreBanner) draftRestoreBanner.hidden = true;
    showToast("Draft dipulihkan", "Cek kembali lalu klik Simpan untuk mengirim ke server.", "success");
  });
}
if (btnDiscardDraft) {
  btnDiscardDraft.addEventListener("click", () => {
    clearLocalDraft();
    showToast("Draft dibuang", "Draft lokal sudah dihapus.", "info");
  });
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
  if (isConfigEditTarget(target)) markDirty();
  schedulePreviewRefresh();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
  if (isConfigEditTarget(target)) markDirty();
  schedulePreviewRefresh();
});

window.addEventListener("beforeunload", (event) => {
  if (!isDirty) return;
  writeLocalDraft();
  event.preventDefault();
  event.returnValue = "";
});

adminKeyInput.addEventListener("change", () => {
  saveAdminKey(adminKeyInput.value.trim());
});
invitationBaseUrlInput.addEventListener("change", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
});
invitationBaseUrlInput.addEventListener("input", () => {
  saveInvitationBaseUrl(invitationBaseUrlInput.value);
  refreshGuestViews();
});
fields.weddingDateTimeLocal.addEventListener("input", updateWeddingIsoPreview);
fields.weddingTimeOffset.addEventListener("change", updateWeddingIsoPreview);
fields.eventStartDateTimeLocal.addEventListener("input", updateEventStartIsoPreview);
fields.eventStartOffset.addEventListener("change", updateEventStartIsoPreview);
fields.galleryPhotos.addEventListener("input", renderGalleryPreview);
fields.loveStoryPhotos.addEventListener("input", renderLoveStoryPreview);
if (fields.heroDateStart) {
  fields.heroDateStart.addEventListener("change", generateHeroDatePlaceFromInputs);
}
if (fields.heroDateEnd) {
  fields.heroDateEnd.addEventListener("change", generateHeroDatePlaceFromInputs);
}
if (fields.heroDateCity) {
  fields.heroDateCity.addEventListener("input", () => {
    if (!fields.heroDateStart.value) return;
    generateHeroDatePlaceFromInputs();
  });
}
if (fields.galleryMode) {
  fields.galleryMode.addEventListener("change", updateGalleryModeFields);
}
if (guestSearch) {
  guestSearch.addEventListener("input", () => {
    if (guestAdminModule) guestAdminModule.setPage(1);
    loadGuests();
  });
}
if (guestGroupFilter) {
  guestGroupFilter.addEventListener("change", () => {
    if (guestAdminModule) guestAdminModule.setPage(1);
    loadGuests();
  });
}
if (guestStatusFilter) {
  guestStatusFilter.addEventListener("change", () => {
    if (guestAdminModule) guestAdminModule.setPage(1);
    loadGuests();
  });
}
if (guestPageSize) {
  guestPageSize.addEventListener("change", () => {
    if (guestAdminModule) guestAdminModule.setPage(1);
    loadGuests();
  });
}
if (btnGuestPrev) {
  btnGuestPrev.addEventListener("click", () => {
    if (guestAdminModule) {
      guestAdminModule.setPage(Math.max(guestAdminModule.getPage() - 1, 1));
    }
    loadGuests();
  });
}
if (btnGuestNext) {
  btnGuestNext.addEventListener("click", () => {
    if (guestAdminModule) {
      guestAdminModule.setPage(Math.min(guestAdminModule.getPage() + 1, guestAdminModule.getTotalPages()));
    }
    loadGuests();
  });
}
if (rsvpSearch) {
  rsvpSearch.addEventListener("input", () => {
    if (rsvpAdminModule) rsvpAdminModule.setPage(1);
    loadRsvps();
  });
}
if (rsvpKehadiranFilter) {
  rsvpKehadiranFilter.addEventListener("change", () => {
    if (rsvpAdminModule) rsvpAdminModule.setPage(1);
    loadRsvps();
  });
}
if (rsvpPageSize) {
  rsvpPageSize.addEventListener("change", () => {
    if (rsvpAdminModule) rsvpAdminModule.setPage(1);
    loadRsvps();
  });
}
if (btnRsvpPrev) {
  btnRsvpPrev.addEventListener("click", () => {
    if (rsvpAdminModule) {
      rsvpAdminModule.setPage(Math.max(rsvpAdminModule.getPage() - 1, 1));
    }
    loadRsvps();
  });
}
if (btnRsvpNext) {
  btnRsvpNext.addEventListener("click", () => {
    if (rsvpAdminModule) {
      rsvpAdminModule.setPage(Math.min(rsvpAdminModule.getPage() + 1, rsvpAdminModule.getTotalPages()));
    }
    loadRsvps();
  });
}
if (btnHeroFromGallery) {
  btnHeroFromGallery.addEventListener("click", () => {
    const galleryUrls = getGalleryUrls();
    if (!galleryUrls.length) {
      setStatus(statusGallery, "Galeri kosong. Upload foto dulu.");
      return;
    }
    setHeroFromGallery(galleryUrls[0]);
    setStatus(statusGallery, "Hero background diisi dari foto galeri pertama.");
    markDirty();
    schedulePreviewRefresh();
  });
}
if (btnLoveStoryFromGallery) {
  btnLoveStoryFromGallery.addEventListener("click", () => {
    const count = fillLoveStoryFromGallery();
    if (!count) {
      setStatus(statusGallery, "Galeri kosong. Upload foto dulu.");
      return;
    }
    setStatus(statusGallery, `${count} foto Love Story diisi dari galeri.`);
    markDirty();
    schedulePreviewRefresh();
  });
}
if (ADMIN_RSVP_API_URL && !ADMIN_RSVP_API_URL.includes("PASTE_WEB_APP_URL")) {
  loadConfigFromServer({
    promptBeforeOverwrite: false,
    clearDraftAfterLoad: !savedLocalDraft
  });
  loadGuests();
  loadRsvps();
  loadMusicLibrary({ markAsDirty: false });
}
