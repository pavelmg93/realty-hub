export const LISTING_STATUSES = {
  just_listed: { label: "Just Listed", color: "bg-blue-100 text-blue-800" },
  for_sale: { label: "For Sale", color: "bg-emerald-100 text-emerald-800" },
  price_dropped: { label: "Price Dropped", color: "bg-green-100 text-green-800" },
  price_increased: { label: "Price Increased", color: "bg-red-100 text-red-800" },
  deposit: { label: "Deposit", color: "bg-yellow-100 text-yellow-800" },
  sold: { label: "Sold", color: "bg-rose-100 text-rose-800" },
  not_for_sale: { label: "Not for Sale", color: "bg-slate-100 text-slate-600" },
} as const;

export const PROPERTY_TYPES = {
  nha: "House",
  dat: "Land",
  can_ho: "Apartment",
  phong_tro: "Room",
  biet_thu: "Villa",
  khach_san: "Hotel",
  mat_bang: "Commercial Space",
} as const;

export const TRANSACTION_TYPES = {
  ban: "For Sale",
  cho_thue: "For Rent",
} as const;

export const ACCESS_ROAD_TYPES = {
  mat_duong: "Road-facing",
  hem_oto: "Car Alley",
  hem_thong: "Connecting Alley",
  hem_rong: "Wide Alley",
  hem_nho: "Narrow Alley",
  hem: "Alley",
} as const;

export const FURNISHED_TYPES = {
  full: "Fully Furnished",
  co_ban: "Basic",
  khong: "Unfurnished",
} as const;

export const DIRECTION_TYPES = {
  dong: "East",
  tay: "West",
  nam: "South",
  bac: "North",
  dong_nam: "Southeast",
  tay_nam: "Southwest",
  dong_bac: "Northeast",
  tay_bac: "Northwest",
} as const;

export const LEGAL_STATUS_TYPES = {
  so_hong: "Pink Book",
  so_do: "Red Book",
  hoan_cong: "Completed",
  tho_cu: "Residential Land",
  phap_ly_chuan: "Legal Clear",
} as const;

export const STRUCTURE_TYPES = {
  me_duc: "Concrete Frame",
  gac_lung: "Mezzanine",
  tret_lau: "Ground + Upper",
  cap_4: "Single Story",
} as const;

export const BUILDING_TYPES = {
  xay_moi: "Newly Built",
  kien_co: "Solid Construction",
  nha_cu: "Old House",
  moi_sua: "Renovated",
} as const;

export const NHA_TRANG_WARDS = [
  "Vinh Hoa",
  "Vinh Hai",
  "Vinh Phuoc",
  "Vinh Tho",
  "Van Thanh",
  "Phuong Sai",
  "Ngoc Hiep",
  "Phuoc Hoa",
  "Tan Tien",
  "Phuoc Hai",
  "Loc Tho",
  "Vinh Nguyen",
  "Vinh Truong",
  "Phuoc Long",
  "Phuong Son",
  "Xuong Huan",
  "Van Thang",
  "Phuoc Tien",
  "Phuoc Tan",
  "Tan Lap",
  "Vinh Luong",
  "Vinh Phuong",
  "Vinh Ngoc",
  "Vinh Thanh",
  "Vinh Trung",
  "Vinh Hiep",
  "Vinh Thai",
  "Phuoc Dong",
] as const;

export const DOCUMENT_CATEGORIES = {
  ownership_cert: "Ownership Certificate",
  floorplan: "Floor Plan",
  property_sketch: "Property Sketch",
  use_permit: "Use Permit",
  construction_permit: "Construction Permit",
  proposal: "Proposal",
  other: "Other",
} as const;

/** Person and deal funnel stages (same set) */
export const DEAL_STAGES: Record<string, string> = {
  lead: "Cold Lead",
  engaged: "General",
  considering: "Considering",
  viewing: "Seeing Properties",
  negotiating: "Negotiating",
  closing: "Closing",
  won: "Closed-Won",
  lost: "Closed-Lost",
};

export function formatPrice(vnd: number | null): string {
  if (!vnd) return "";
  if (vnd >= 1_000_000_000) {
    const ty = vnd / 1_000_000_000;
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1)} ty`;
  }
  if (vnd >= 1_000_000) {
    const tr = vnd / 1_000_000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)} trieu`;
  }
  return vnd.toLocaleString("vi-VN") + " VND";
}

export function formatPriceShortest(vnd: number | null): string {
  if (!vnd) return "";
  if (vnd >= 1_000_000_000) {
    const ty = vnd / 1_000_000_000;
    return `${parseFloat(ty.toFixed(2)).toString()}ty`;
  }
  if (vnd >= 1_000_000) {
    const tr = vnd / 1_000_000;
    return `${parseFloat(tr.toFixed(2)).toString()}tr`;
  }
  return vnd.toString();
}

/**
 * Build title_standardized — specs line (no address).
 * Formula: "<area>m² <floors>T <frontage>x<depth> <commission> <price>"
 * Example: "100m² 7T 10x10 hh1 20ty"
 */
export function generateTitleStandardized(data: {
  address_raw?: string | null;
  street?: string | null;
  ward?: string | null;
  area_m2?: number | null;
  num_floors?: number | null;
  frontage_m?: number | null;
  depth_m?: number | null;
  price_vnd?: number | null;
  price_short?: string | null;
  commission?: string | null;
}): string {
  const parts: string[] = [];

  if (data.area_m2) parts.push(`${data.area_m2}`);
  if (data.num_floors) parts.push(`${data.num_floors}`);

  const dimParts: string[] = [];
  if (data.frontage_m) dimParts.push(data.frontage_m.toString());
  if (data.depth_m) dimParts.push(data.depth_m.toString());
  if (dimParts.length > 0) parts.push(dimParts.join(" "));

  parts.push(data.commission || "hh1");

  const priceStr = data.price_short ?? (data.price_vnd ? formatPriceShortest(data.price_vnd) : null);
  if (priceStr) parts.push(priceStr);

  return parts.join(" ");
}
