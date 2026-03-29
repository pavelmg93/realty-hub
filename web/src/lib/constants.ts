export const LISTING_STATUSES = {
  just_listed: { label: "Just Listed", color: "bg-blue-100 text-blue-800" },
  selling: { label: "Selling", color: "bg-emerald-100 text-emerald-800" },
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

/** ASCII → Vietnamese display name for all individual wards */
export const WARD_DISPLAY_NAME: Record<string, string> = {
  "Vinh Hoa": "Vĩnh Hòa",
  "Vinh Hai": "Vĩnh Hải",
  "Vinh Phuoc": "Vĩnh Phước",
  "Vinh Tho": "Vĩnh Thọ",
  "Van Thanh": "Vạn Thạnh",
  "Phuong Sai": "Phương Sài",
  "Ngoc Hiep": "Ngọc Hiệp",
  "Phuoc Hoa": "Phước Hòa",
  "Tan Tien": "Tân Tiến",
  "Phuoc Hai": "Phước Hải",
  "Loc Tho": "Lộc Thọ",
  "Vinh Nguyen": "Vĩnh Nguyên",
  "Vinh Truong": "Vĩnh Trường",
  "Phuoc Long": "Phước Long",
  "Phuong Son": "Phương Sơn",
  "Xuong Huan": "Xương Huân",
  "Van Thang": "Vạn Thắng",
  "Phuoc Tien": "Phước Tiến",
  "Phuoc Tan": "Phước Tân",
  "Tan Lap": "Tân Lập",
  "Vinh Luong": "Vĩnh Lương",
  "Vinh Phuong": "Vĩnh Phương",
  "Vinh Ngoc": "Vĩnh Ngọc",
  "Vinh Thanh": "Vĩnh Thạnh",
  "Vinh Trung": "Vĩnh Trung",
  "Vinh Hiep": "Vĩnh Hiệp",
  "Vinh Thai": "Vĩnh Thái",
  "Phuoc Dong": "Phước Đồng",
};

/**
 * New Ward = 4 administrative regions (post-2024 reorganization).
 * ward_new column stores these region names.
 */
export const NEW_WARD_OPTIONS: Record<string, string> = {
  "Nha Trang Ward": "P. Nha Trang",
  "Bac Nha Trang": "Bắc Nha Trang",
  "Tay Nha Trang": "Tây Nha Trang",
  "Nam Nha Trang": "Nam Nha Trang",
};

/** Region → list of old wards (ASCII) that belong to it */
export const REGION_TO_WARDS: Record<string, string[]> = {
  "P. Nha Trang": ["Van Thanh", "Loc Tho", "Vinh Nguyen", "Tan Tien", "Phuoc Hoa",
    // Pre-merger wards that merged into Nha Trang Ward wards
    "Xuong Huan", "Van Thang", "Phuoc Tien", "Phuoc Tan", "Tan Lap"],
  "Bac Nha Trang": ["Vinh Hoa", "Vinh Hai", "Vinh Phuoc", "Vinh Tho", "Vinh Luong", "Vinh Phuong"],
  "Tay Nha Trang": ["Ngoc Hiep", "Phuong Sai", "Vinh Ngoc", "Vinh Thanh", "Vinh Hiep", "Vinh Trung",
    // Pre-merger
    "Phuong Son"],
  "Nam Nha Trang": ["Phuoc Hai", "Phuoc Long", "Vinh Truong", "Vinh Thai", "Phuoc Dong"],
};

/** Old ward (ASCII) → region. Built from REGION_TO_WARDS. */
export const WARD_TO_REGION: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_TO_WARDS).flatMap(([region, wards]) =>
    wards.map((w) => [w, region])
  )
);

/** Format ward for display. Shows "Region / Ward (Vietnamese)" or just one. */
export function formatWardDisplay(wardNew: string | null, wardOld: string | null): string | null {
  const regionLabel = wardNew ? (NEW_WARD_OPTIONS[wardNew] || wardNew) : null;
  const wardLabel = wardOld ? (WARD_DISPLAY_NAME[wardOld] || wardOld) : null;

  if (regionLabel && wardLabel) return `${regionLabel} / ${wardLabel}`;
  if (regionLabel) return regionLabel;
  if (wardLabel) return wardLabel;
  return null;
}

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
 * Convert commission pct or months to display string.
 * pct=1 → "hh1", months=2 → "mm2", neither → "hh1"
 */
export function generateCommissionDisplay(
  pct?: number | null,
  months?: number | null,
): string {
  if (pct != null && pct > 0) return `hh${pct}`;
  if (months != null && months > 0) return `mm${months}`;
  return "hh1";
}

/**
 * Build title_standardized — specs line (no address).
 * Formula: "<area>m² <floors>T <frontage>x<depth> <price> <commission>"
 * Example: "100 7 10 10 20ty hh1"
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

  const priceStr = data.price_short ?? (data.price_vnd ? formatPriceShortest(data.price_vnd) : null);
  if (priceStr) parts.push(priceStr);

  parts.push(data.commission || "hh1");

  return parts.join(" ");
}
