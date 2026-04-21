import { normalizeBoolean, parseJsonValue } from "../utils.js";
import {
  BANK_CATALOG,
  BANK_OPTIONS,
  EWALLET_CATALOG,
  EWALLET_OPTIONS,
  findProviderByName,
  findProviderOptionByCode,
  findProviderOptionByName
} from "../catalogs.js";

export function normalizeGiftType(value) {
  const clean = String(value || "").trim().toLowerCase();
  return clean === "ewallet" ? "ewallet" : "bank";
}

export function getGiftProviderCode(account) {
  return String(account && (account.providerCode || account.bankCode) || "").trim().toLowerCase();
}

export function getGiftProviderName(account) {
  return String(account && (account.providerName || account.bankName) || "").trim();
}

export function inferGiftAccountType(account) {
  const explicit = String(account && (account.type || account.category) || "").trim().toLowerCase();
  const providerCode = getGiftProviderCode(account);
  const providerName = getGiftProviderName(account);
  if (providerCode && EWALLET_CATALOG[providerCode]) return "ewallet";
  if (providerCode && BANK_CATALOG[providerCode]) return "bank";
  if (findProviderByName(EWALLET_CATALOG, providerName)) return "ewallet";
  if (findProviderByName(BANK_CATALOG, providerName)) return "bank";
  if (explicit === "bank" || explicit === "ewallet") return explicit;

  const source = `${providerCode} ${providerName}`.toLowerCase();
  const ewalletKeywords = ["dana", "ovo", "gopay", "go-pay", "shopeepay", "shopee pay", "linkaja", "link aja", "sakuku"];
  return ewalletKeywords.some((keyword) => source.includes(keyword)) ? "ewallet" : "bank";
}

export function getGiftProviderMeta(account) {
  const type = normalizeGiftType(account && account.type || inferGiftAccountType(account));
  const catalog = type === "ewallet" ? EWALLET_CATALOG : BANK_CATALOG;
  const providerCode = getGiftProviderCode(account);
  if (providerCode && catalog[providerCode]) return catalog[providerCode];
  return findProviderByName(catalog, getGiftProviderName(account));
}

export function normalizeGiftAccounts(input, options = {}) {
  const source = parseJsonValue(input, []);
  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      const type = inferGiftAccountType(item);
      const providerCode = getGiftProviderCode(item);
      const providerName = getGiftProviderName(item);
      const catalog = type === "ewallet" ? EWALLET_CATALOG : BANK_CATALOG;
      const providerMeta = (providerCode && catalog[providerCode]) || findProviderByName(catalog, providerName);
      return {
        type,
        providerCode: providerMeta ? providerMeta.code : providerCode,
        providerName: String((providerMeta && providerMeta.name) || providerName || "").trim(),
        accountNumber: String(item && item.accountNumber || "").replace(/\D+/g, ""),
        accountHolder: String(item && item.accountHolder || "").trim(),
        logoUrl: String((providerMeta && providerMeta.logoUrl) || item && item.logoUrl || "").trim(),
        isActive: normalizeBoolean(item && item.isActive, true)
      };
    })
    .filter((item) => options.keepEmpty || item.accountNumber);
}

export function createDefaultGiftAccount() {
  const fallbackBank = BANK_OPTIONS[0];
  return {
    type: "bank",
    providerCode: fallbackBank.code,
    providerName: fallbackBank.name,
    accountNumber: "",
    accountHolder: "",
    logoUrl: fallbackBank.logoUrl,
    isActive: true
  };
}

export function getBankOptionByCode(code) {
  return findProviderOptionByCode(BANK_OPTIONS, code);
}

export function getBankOptionByName(name) {
  return findProviderOptionByName(BANK_OPTIONS, name);
}

export function getEwalletOptionByCode(code) {
  return findProviderOptionByCode(EWALLET_OPTIONS, code);
}

export function getEwalletOptionByName(name) {
  return findProviderOptionByName(EWALLET_OPTIONS, name);
}
