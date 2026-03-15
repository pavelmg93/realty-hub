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
} from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTypeKey, getTransactionTypeKey } from "@/lib/i18n";

/** Parse Vietnamese price text like "10 ty", "500 trieu", "3.5 tỷ" to VND. */
function parseRawPrice(raw: string): number | null {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(/,/g, ".").trim();
  const match = text.match(/^([\d.]+)\s*(ty|tỷ|ti|trieu|triệu|tr)?\s*$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const unit = match[2];
  if (unit === "ty" || unit === "tỷ" || unit === "ti") {
    return num * 1_000_000_000;
  }
  if (unit === "trieu" || unit === "triệu" || unit === "tr") {
    return num * 1_000_000;
  }
  return num;
}

/** Format VND number to concise Vietnamese text like "3.5 ty", "500 trieu". */
function formatVndToRaw(vnd: number): string {
  if (vnd >= 1_000_000_000) {
    const ty = vnd / 1_000_000_000;
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1)} ty`;
  }
  if (vnd >= 1_000_000) {
    const tr = vnd / 1_000_000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)} trieu`;
  }
  return vnd.toString();
}

interface Props {
  data: ListingInput;
  onChange: (data: ListingInput) => void;
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
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg px-3 py-2 text-sm"
      >
        <option value="">—</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
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
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          step={step}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          className="w-full rounded-lg px-3 py-2 text-sm"
        />
        {suffix && (
          <span className="text-xs whitespace-nowrap text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg px-3 py-2 text-sm"
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
    <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border)]">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function LocationPicker({
  data,
  onChange,
}: {
  data: ListingInput;
  onChange: (updates: Partial<ListingInput>) => void;
}) {
  const { t } = useLanguage();
  const [geocoding, setGeocoding] = useState(false);
  const [results, setResults] = useState<
    { latitude: number; longitude: number; display_name: string }[]
  >([]);

  const handleGeocode = async () => {
    const q = [data.address_raw, data.street, data.ward]
      .filter(Boolean)
      .join(", ");
    if (!q) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`,
      );
      if (res.ok) {
        const { locations } = await res.json();
        setResults(locations);
        if (locations.length === 1) {
          onChange({
            latitude: locations[0].latitude,
            longitude: locations[0].longitude,
          });
        }
      }
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] pb-2 border-b border-[var(--border)] flex-1">
          {t("mapLocation")}
        </h3>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {geocoding ? t("searching") : t("lookupAddress")}
        </button>
      </div>

      {results.length > 1 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs text-[var(--text-muted)]">{t("selectResult")}</p>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange({ latitude: r.latitude, longitude: r.longitude });
                setResults([]);
              }}
              className="block w-full text-left px-3 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors truncate"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] mb-2">
        {t("clickMapToSetLocation")}
      </p>
      <DynamicListingMap
        latitude={data.latitude}
        longitude={data.longitude}
        onLocationChange={(lat, lng) =>
          onChange({ latitude: lat, longitude: lng })
        }
        interactive={true}
        height="250px"
      />
    </div>
  );
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  just_listed: "justListed",
  for_sale: "forSale",
  price_dropped: "priceDropped",
  price_increased: "priceIncreased",
  deposit: "deposit",
  sold: "sold",
  not_for_sale: "notForSale",
};

export default function DatabaseView({ data, onChange }: Props) {
  const { t } = useLanguage();
  const set = (field: keyof ListingInput, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const setMultiple = (updates: Partial<ListingInput>) => {
    onChange({ ...data, ...updates });
  };

  const statusOptions = Object.fromEntries(
    Object.entries(LISTING_STATUSES).map(([k, v]) => [
      k,
      (t as (key: string) => string)(STATUS_LABEL_KEYS[k] ?? "open"),
    ])
  );
  const propertyTypeOptions = Object.fromEntries(
    Object.entries(PROPERTY_TYPES).map(([k, v]) => [
      k,
      getPropertyTypeKey(k) ? t(getPropertyTypeKey(k)!) : v,
    ])
  );
  const transactionTypeOptions = Object.fromEntries(
    Object.entries(TRANSACTION_TYPES).map(([k, v]) => [
      k,
      getTransactionTypeKey(k) ? t(getTransactionTypeKey(k)!) : v,
    ])
  );

  const handlePriceRawBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const vnd = parseRawPrice(raw);
    if (vnd !== null) {
      onChange({ ...data, price_raw: raw || null, price_vnd: vnd });
    }
  };

  const handlePriceVndBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const vnd = val ? parseFloat(val) : null;
    if (vnd && vnd > 0) {
      onChange({ ...data, price_vnd: vnd, price_raw: formatVndToRaw(vnd) });
    }
  };

  return (
    <div>
      <Section title={t("classification")}>
        <SelectField
          label={t("status")}
          value={data.status}
          options={statusOptions}
          onChange={(v) => set("status", v ?? "for_sale")}
        />
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
      </Section>

      <Section title={t("priceAndArea")}>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
            {t("priceRawText")}
          </label>
          <input
            type="text"
            value={data.price_raw ?? ""}
            onChange={(e) => set("price_raw", e.target.value || null)}
            onBlur={handlePriceRawBlur}
            placeholder={t("pricePlaceholder")}
            className="w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
            {t("priceVnd")}
          </label>
          <input
            type="number"
            value={data.price_vnd ?? ""}
            onChange={(e) => set("price_vnd", e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={handlePriceVndBlur}
            className="w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <NumberField
          label={t("area")}
          value={data.area_m2}
          onChange={(v) => set("area_m2", v)}
          step="0.1"
          suffix="m²"
        />
        <NumberField
          label={t("pricePerM2")}
          value={data.price_per_m2}
          onChange={(v) => set("price_per_m2", v)}
          suffix="VND"
        />
        <NumberField
          label={t("rentalIncome")}
          value={data.rental_income_vnd}
          onChange={(v) => set("rental_income_vnd", v)}
          suffix="VND/mo"
        />
        <CheckboxField
          label={t("negotiable")}
          value={data.negotiable}
          onChange={(v) => set("negotiable", v)}
        />
      </Section>

      <Section title={t("location")}>
        <TextField
          label={t("addressRaw")}
          value={data.address_raw}
          onChange={(v) => set("address_raw", v)}
        />
        <SelectField
          label={t("ward")}
          value={data.ward}
          options={Object.fromEntries(NHA_TRANG_WARDS.map((w) => [w, w]))}
          onChange={(v) => set("ward", v)}
        />
        <TextField
          label={t("street")}
          value={data.street}
          onChange={(v) => set("street", v)}
        />
        <TextField
          label={t("district")}
          value={data.district}
          onChange={(v) => set("district", v)}
        />
        <NumberField
          label={t("latitude")}
          value={data.latitude}
          onChange={(v) => set("latitude", v)}
          step="0.000001"
        />
        <NumberField
          label={t("longitude")}
          value={data.longitude}
          onChange={(v) => set("longitude", v)}
          step="0.000001"
        />
      </Section>

      <LocationPicker data={data} onChange={setMultiple} />

      <Section title={t("dimensions")}>
        <NumberField
          label={t("bedrooms")}
          value={data.num_bedrooms}
          onChange={(v) => set("num_bedrooms", v)}
        />
        <NumberField
          label={t("bathrooms")}
          value={data.num_bathrooms}
          onChange={(v) => set("num_bathrooms", v)}
        />
        <NumberField
          label={t("floors")}
          value={data.num_floors}
          onChange={(v) => set("num_floors", v)}
        />
        <NumberField
          label={t("frontage")}
          value={data.frontage_m}
          onChange={(v) => set("frontage_m", v)}
          step="0.1"
          suffix="m"
        />
        <NumberField
          label={t("depth")}
          value={data.depth_m}
          onChange={(v) => set("depth_m", v)}
          step="0.1"
          suffix="m"
        />
        <NumberField
          label={t("totalConstruction")}
          value={data.total_construction_area}
          onChange={(v) => set("total_construction_area", v)}
          step="0.1"
          suffix="m²"
        />
        <CheckboxField
          label={t("cornerLot")}
          value={data.corner_lot}
          onChange={(v) => set("corner_lot", v)}
        />
      </Section>

      <Section title={t("structureAndFeatures")}>
        <SelectField
          label={t("structureType")}
          value={data.structure_type}
          options={STRUCTURE_TYPES}
          onChange={(v) => set("structure_type", v)}
        />
        <SelectField
          label={t("buildingType")}
          value={data.building_type}
          options={BUILDING_TYPES}
          onChange={(v) => set("building_type", v)}
        />
        <SelectField
          label={t("direction")}
          value={data.direction}
          options={DIRECTION_TYPES}
          onChange={(v) => set("direction", v)}
        />
        <SelectField
          label={t("legalStatus")}
          value={data.legal_status}
          options={LEGAL_STATUS_TYPES}
          onChange={(v) => set("legal_status", v)}
        />
        <SelectField
          label={t("accessRoad")}
          value={data.access_road}
          options={ACCESS_ROAD_TYPES}
          onChange={(v) => set("access_road", v)}
        />
        <SelectField
          label={t("furnished")}
          value={data.furnished}
          options={FURNISHED_TYPES}
          onChange={(v) => set("furnished", v)}
        />
        <CheckboxField
          label={t("hasElevator")}
          value={data.has_elevator}
          onChange={(v) => set("has_elevator", v)}
        />
      </Section>

      <Section title={t("extraDetails")}>
        <TextField
          label={t("fengShui")}
          value={data.feng_shui}
          onChange={(v) => set("feng_shui", v)}
        />
        <TextField
          label={t("landCharacteristics")}
          value={data.land_characteristics}
          onChange={(v) => set("land_characteristics", v)}
        />
        <TextField
          label={t("trafficConnectivity")}
          value={data.traffic_connectivity}
          onChange={(v) => set("traffic_connectivity", v)}
        />
      </Section>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border)]">
          {t("description")}
        </h3>
        <textarea
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          rows={3}
          className="w-full rounded-lg px-3 py-2 text-sm resize-y"
        />
      </div>
    </div>
  );
}
