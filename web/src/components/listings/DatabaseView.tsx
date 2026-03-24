"use client";

import { useState } from "react";
import DynamicListingMap from "@/components/map/DynamicListingMap";
import { ListingInput } from "@/lib/validation";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  ACCESS_ROAD_TYPES,
  FURNISHED_TYPES,
  DIRECTION_TYPES,
  LEGAL_STATUS_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPES,
  LISTING_STATUSES,
  NHA_TRANG_WARDS,
  generateCommissionDisplay,
} from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTypeKey, getTransactionTypeKey, getFieldValueLabel } from "@/lib/i18n";

/** Parse Vietnamese price text like "10 ty", "500 trieu", "3.5 tỷ" to VND. */
function parseRawPrice(raw: string): number | null {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(/,/g, ".").trim();
  const match = text.match(/^([\d.]+)\s*(ty|tỷ|ti|trieu|triệu|tr)?\s*$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const unit = match[2];
  if (unit === "ty" || unit === "tỷ" || unit === "ti") return num * 1_000_000_000;
  if (unit === "trieu" || unit === "triệu" || unit === "tr") return num * 1_000_000;
  return num;
}

interface Props {
  data: ListingInput;
  onChange: (data: ListingInput) => void;
  isEdit?: boolean;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  options: Record<string, string>;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
      >
        <option value="">—</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  suffix,
  placeholder,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ""}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
        />
        {suffix && <span className="text-xs whitespace-nowrap text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
      />
    </div>
  );
}

function CheckboxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)] py-1">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded accent-[var(--orange)]"
      />
      {label}
    </label>
  );
}

function Row({ cols = 3, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid gap-3 mb-4 ${cols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-5">
      {children}
    </p>
  );
}

function LocationPicker({ data, onChange }: { data: ListingInput; onChange: (u: Partial<ListingInput>) => void }) {
  const { t } = useLanguage();
  const [geocoding, setGeocoding] = useState(false);
  const [results, setResults] = useState<{ latitude: number; longitude: number; display_name: string }[]>([]);

  const handleGeocode = async () => {
    const q = [data.street, data.ward].filter(Boolean).join(", ") + ", Nha Trang";
    if (!q.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const { locations } = await res.json();
        setResults(locations);
        if (locations.length === 1) onChange({ latitude: locations[0].latitude, longitude: locations[0].longitude });
      }
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex-1">{t("mapLocation")}</p>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {geocoding ? t("searching") : t("lookupAddress")}
        </button>
      </div>
      {results.length > 1 && (
        <div className="mb-2 space-y-1">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange({ latitude: r.latitude, longitude: r.longitude }); setResults([]); }}
              className="block w-full text-left px-3 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors truncate"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)] mb-2">{t("clickMapToSetLocation")}</p>
      <DynamicListingMap
        latitude={data.latitude}
        longitude={data.longitude}
        onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        interactive={true}
        height="250px"
      />
    </div>
  );
}

/** New administrative ward groupings (post-2025 merger) */
const NEW_WARD_OPTIONS: Record<string, string> = {
  "Van Thanh": "Vạn Thạnh",
  "Loc Tho": "Lộc Thọ",
  "Vinh Nguyen": "Vĩnh Nguyên",
  "Tan Tien": "Tân Tiến",
  "Phuoc Hoa": "Phước Hòa",
  "Vinh Hoa": "Vĩnh Hòa",
  "Vinh Hai": "Vĩnh Hải",
  "Vinh Phuoc": "Vĩnh Phước",
  "Vinh Tho": "Vĩnh Thọ",
  "Vinh Luong": "Vĩnh Lương",
  "Vinh Phuong": "Vĩnh Phương",
  "Ngoc Hiep": "Ngọc Hiệp",
  "Phuong Sai": "Phương Sài",
  "Vinh Ngoc": "Vĩnh Ngọc",
  "Vinh Thanh": "Vĩnh Thạnh",
  "Vinh Hiep": "Vĩnh Hiệp",
  "Vinh Trung": "Vĩnh Trung",
  "Phuoc Hai": "Phước Hải",
  "Phuoc Long": "Phước Long",
  "Vinh Truong": "Vĩnh Trường",
  "Vinh Thai": "Vĩnh Thái",
  "Phuoc Dong": "Phước Đồng",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  just_listed: "justListed",
  for_sale: "forSale",
  price_dropped: "priceDropped",
  price_increased: "priceIncreased",
  deposit: "deposit",
  sold: "sold",
  not_for_sale: "notForSale",
};

export default function DatabaseView({ data, onChange, isEdit = false }: Props) {
  const { t, lang } = useLanguage();

  const set = (field: keyof ListingInput, value: unknown) => onChange({ ...data, [field]: value });
  const setMultiple = (updates: Partial<ListingInput>) => onChange({ ...data, ...updates });

  const statusOptions = Object.fromEntries(
    Object.entries(LISTING_STATUSES).map(([k]) => [k, (t as (key: string) => string)(STATUS_LABEL_KEYS[k] ?? "open")])
  );
  const propertyTypeOptions = Object.fromEntries(
    Object.entries(PROPERTY_TYPES).map(([k, v]) => [k, getPropertyTypeKey(k) ? t(getPropertyTypeKey(k)!) : v])
  );
  const transactionTypeOptions = Object.fromEntries(
    Object.entries(TRANSACTION_TYPES).map(([k, v]) => [k, getTransactionTypeKey(k) ? t(getTransactionTypeKey(k)!) : v])
  );

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const vnd = parseRawPrice(e.target.value);
    if (vnd !== null) {
      const ppm2 = (data.area_m2 && data.area_m2 > 0) ? Math.round(vnd / data.area_m2) : data.price_per_m2;
      setMultiple({ price_raw: e.target.value || null, price_vnd: vnd, price_per_m2: ppm2 });
    }
  };

  const handleAreaChange = (v: number | null) => {
    const ppm2 = (v && v > 0 && data.price_vnd) ? Math.round(data.price_vnd / v) : data.price_per_m2;
    setMultiple({ area_m2: v, price_per_m2: ppm2 });
  };

  // Commission mode derived from data
  const commMode: "pct" | "months" = (data.commission_months != null && (data.commission_pct == null)) ? "months" : "pct";
  const commValue = commMode === "pct" ? (data.commission_pct ?? 1) : (data.commission_months ?? 1);

  const handleCommissionChange = (mode: "pct" | "months", value: number) => {
    const pct = mode === "pct" ? value : null;
    const months = mode === "months" ? value : null;
    const commission = generateCommissionDisplay(pct, months);
    setMultiple({ commission_pct: pct, commission_months: months, commission });
  };

  return (
    <div>
      {/* ── Row 1: Classification ── */}
      <SectionLabel>{t("classification")}</SectionLabel>
      <Row cols={3}>
        <SelectField
          label={t("property")}
          value={data.property_type}
          options={propertyTypeOptions}
          onChange={(v) => set("property_type", v)}
        />
        <SelectField
          label={t("transaction")}
          value={data.transaction_type}
          options={transactionTypeOptions}
          onChange={(v) => set("transaction_type", v)}
        />
        <SelectField
          label={t("legalStatus")}
          value={data.legal_status}
          options={LEGAL_STATUS_TYPES}
          onChange={(v) => set("legal_status", v)}
        />
      </Row>

      {/* ── Row 2: Price / Area / P/m² ── */}
      <SectionLabel>{t("priceAndArea")}</SectionLabel>
      <Row cols={3}>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("price")}</label>
          <input
            type="text"
            value={data.price_raw ?? ""}
            onChange={(e) => set("price_raw", e.target.value || null)}
            onBlur={handlePriceBlur}
            placeholder={t("pricePlaceholder")}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          />
        </div>
        <NumberField
          label={t("area")}
          value={data.area_m2}
          onChange={handleAreaChange}
          step="0.1"
          suffix="m²"
        />
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("pricePerM2")}</label>
          <input
            type="text"
            readOnly
            value={data.price_per_m2 != null ? `${data.price_per_m2.toLocaleString("vi-VN")} ₫/m²` : "—"}
            className="w-full rounded-lg px-3 py-2 text-sm cursor-not-allowed"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)", borderColor: "var(--border)" }}
          />
        </div>
      </Row>

      {/* ── Row 3: Commission ── */}
      <SectionLabel>{t("commission")}</SectionLabel>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)]">
            <input
              type="radio"
              name="commission_mode"
              checked={commMode === "pct"}
              onChange={() => handleCommissionChange("pct", commValue)}
              className="accent-[var(--orange)]"
            />
            %
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)]">
            <input
              type="radio"
              name="commission_mode"
              checked={commMode === "months"}
              onChange={() => handleCommissionChange("months", commValue)}
              className="accent-[var(--orange)]"
            />
            {t("months")}
          </label>
        </div>
        <input
          type="number"
          value={commValue}
          min={0}
          step={commMode === "pct" ? "0.5" : "1"}
          onChange={(e) => handleCommissionChange(commMode, parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
        />
      </div>

      {/* ── Row 4+5: Address (Street + Ward combined) ── */}
      <SectionLabel>{t("address")}</SectionLabel>
      <div className="mb-4">
        <TextField
          label={t("streetAddress")}
          value={data.street}
          onChange={(v) => set("street", v)}
          placeholder={lang === "vi" ? "VD: 16/3 Hùng Vương" : "e.g. 16/3 Hung Vuong"}
        />
      </div>
      <Row cols={2}>
        <SelectField
          label={t("wardOld")}
          value={data.ward}
          options={Object.fromEntries(NHA_TRANG_WARDS.map((w) => [w, w]))}
          onChange={(v) => set("ward", v)}
        />
        <SelectField
          label={t("wardNew")}
          value={data.ward_new}
          options={NEW_WARD_OPTIONS}
          onChange={(v) => set("ward_new", v)}
        />
      </Row>

      {/* ── Row 6: Status — edit only ── */}
      {isEdit && (
        <>
          <SectionLabel>{t("listingStatus")}</SectionLabel>
          <div className="mb-4 w-1/2">
            <SelectField
              label={t("listingStatus")}
              value={data.status}
              options={statusOptions}
              onChange={(v) => set("status", v ?? "for_sale")}
            />
          </div>
        </>
      )}

      {/* ── Row 7: Map ── */}
      <LocationPicker data={data} onChange={setMultiple} />

      {/* ── Rows 8-10: Dimensions (2-col) ── */}
      <SectionLabel>{t("dimensions")}</SectionLabel>
      <Row cols={2}>
        <NumberField label={t("frontage")} value={data.frontage_m} onChange={(v) => set("frontage_m", v)} step="0.1" suffix="m" />
        <NumberField label={t("depth")} value={data.depth_m} onChange={(v) => set("depth_m", v)} step="0.1" suffix="m" />
      </Row>
      <Row cols={2}>
        <NumberField label={t("bedrooms")} value={data.num_bedrooms} onChange={(v) => set("num_bedrooms", v)} />
        <NumberField label={t("bathrooms")} value={data.num_bathrooms} onChange={(v) => set("num_bathrooms", v)} />
      </Row>
      <Row cols={2}>
        <NumberField label={t("floors")} value={data.num_floors} onChange={(v) => set("num_floors", v)} />
        <NumberField label={t("totalConstruction")} value={data.total_construction_area} onChange={(v) => set("total_construction_area", v)} step="0.1" suffix="m²" />
      </Row>
    </div>
  );
}

/** Extras section rendered separately (after photos/docs in ListingForm) */
export function DatabaseExtras({ data, onChange }: Props) {
  const { t, lang } = useLanguage();
  const set = (field: keyof ListingInput, value: unknown) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("accessRoad")}</label>
          <select
            value={data.access_road ?? ""}
            onChange={(e) => set("access_road", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            <option value="">—</option>
            {Object.entries(ACCESS_ROAD_TYPES).map(([k]) => <option key={k} value={k}>{getFieldValueLabel("access_road", k, lang)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("furnished")}</label>
          <select
            value={data.furnished ?? ""}
            onChange={(e) => set("furnished", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            <option value="">—</option>
            {Object.entries(FURNISHED_TYPES).map(([k]) => <option key={k} value={k}>{getFieldValueLabel("furnished", k, lang)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("direction")}</label>
          <select
            value={data.direction ?? ""}
            onChange={(e) => set("direction", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            <option value="">—</option>
            {Object.entries(DIRECTION_TYPES).map(([k]) => <option key={k} value={k}>{getFieldValueLabel("direction", k, lang)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("structureType")}</label>
          <select
            value={data.structure_type ?? ""}
            onChange={(e) => set("structure_type", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            <option value="">—</option>
            {Object.entries(STRUCTURE_TYPES).map(([k]) => <option key={k} value={k}>{getFieldValueLabel("structure_type", k, lang)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
            <input type="checkbox" checked={data.corner_lot ?? false} onChange={(e) => set("corner_lot", e.target.checked)} className="accent-[var(--orange)]" />
            {t("cornerLot")}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
            <input type="checkbox" checked={data.has_elevator ?? false} onChange={(e) => set("has_elevator", e.target.checked)} className="accent-[var(--orange)]" />
            {t("hasElevator")}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
            <input type="checkbox" checked={data.negotiable ?? false} onChange={(e) => set("negotiable", e.target.checked)} className="accent-[var(--orange)]" />
            {t("negotiable")}
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("rentalIncome")}</label>
          <input
            type="number"
            value={data.rental_income_vnd ?? ""}
            onChange={(e) => set("rental_income_vnd", e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("trafficConnectivity")}</label>
          <input
            type="text"
            value={data.traffic_connectivity ?? ""}
            onChange={(e) => set("traffic_connectivity", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{t("fengShui")}</label>
          <input
            type="text"
            value={data.feng_shui ?? ""}
            onChange={(e) => set("feng_shui", e.target.value || null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          />
        </div>
      </div>
    </div>
  );
}
