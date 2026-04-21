export const BANK_OPTIONS = [
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

export const EWALLET_OPTIONS = [
  { code: "dana", name: "DANA", logoUrl: "assets/ewallet/dana.svg", aliases: ["dana"] },
  { code: "ovo", name: "OVO", logoUrl: "assets/ewallet/ovo.svg", aliases: ["ovo"] },
  { code: "gopay", name: "GoPay", logoUrl: "assets/ewallet/gopay.svg", aliases: ["gopay", "go-pay"] },
  { code: "shopeepay", name: "ShopeePay", logoUrl: "assets/ewallet/shopeepay.svg", aliases: ["shopeepay", "shopee pay"] },
  { code: "linkaja", name: "LinkAja", logoUrl: "assets/ewallet/linkaja.svg", aliases: ["linkaja", "link aja"] },
  { code: "sakuku", name: "Sakuku", logoUrl: "assets/ewallet/sakuku.svg", aliases: ["sakuku"] }
];

export const BANK_CATALOG = Object.fromEntries(BANK_OPTIONS.map((item) => [item.code, item]));
export const EWALLET_CATALOG = Object.fromEntries(EWALLET_OPTIONS.map((item) => [item.code, item]));

export function findProviderByName(catalog, name) {
  const clean = String(name || "").trim().toLowerCase();
  if (!clean) return null;
  return Object.values(catalog).find((item) =>
    item.name.toLowerCase() === clean
    || (Array.isArray(item.aliases) && item.aliases.some((alias) => alias.toLowerCase() === clean))
  ) || null;
}

export function findProviderOptionByCode(options, code) {
  const clean = String(code || "").trim().toLowerCase();
  return options.find((item) => item.code === clean) || null;
}

export function findProviderOptionByName(options, name) {
  const clean = String(name || "").trim().toLowerCase();
  if (!clean) return null;
  return options.find((item) =>
    item.name.toLowerCase() === clean
    || (Array.isArray(item.aliases) && item.aliases.some((alias) => alias.toLowerCase() === clean))
  ) || null;
}
