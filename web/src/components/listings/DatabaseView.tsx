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
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      >
        <option value="">--</option>
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
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ""}
          step={step}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        {suffix && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
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
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
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
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded accent-accent"
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
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-navy mb-2 pb-1 border-b border-slate-200">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
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
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-navy pb-1 border-b border-slate-200 flex-1">
          Map Location
        </h3>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding}
          className="px-3 py-1 text-xs bg-navy/10 text-navy rounded-lg hover:bg-navy/20 transition-colors disabled:opacity-50"
        >
          {geocoding ? "Searching..." : "Lookup Address"}
        </button>
      </div>

      {results.length > 1 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs text-slate-500">Select a result:</p>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange({ latitude: r.latitude, longitude: r.longitude });
                setResults([]);
              }}
              className="block w-full text-left px-2 py-1.5 text-xs bg-slate-50 rounded hover:bg-slate-100 transition-colors truncate"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mb-2">
        Click on the map to set the exact location
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

export default function DatabaseView({ data, onChange }: Props) {
  const set = (field: keyof ListingInput, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const setMultiple = (updates: Partial<ListingInput>) => {
    onChange({ ...data, ...updates });
  };

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
      <Section title="Classification">
        <SelectField
          label="Status"
          value={data.status}
          options={Object.fromEntries(
            Object.entries(LISTING_STATUSES).map(([k, v]) => [k, v.label]),
          )}
          onChange={(v) => set("status", v ?? "for_sale")}
        />
        <SelectField
          label="Property Type"
          value={data.property_type}
          options={PROPERTY_TYPES}
          onChange={(v) => set("property_type", v)}
        />
        <SelectField
          label="Transaction"
          value={data.transaction_type}
          options={TRANSACTION_TYPES}
          onChange={(v) => set("transaction_type", v)}
        />
      </Section>

      <Section title="Price & Area">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Price (raw text)
          </label>
          <input
            type="text"
            value={data.price_raw ?? ""}
            onChange={(e) => set("price_raw", e.target.value || null)}
            onBlur={handlePriceRawBlur}
            placeholder="e.g. 3.5 ty"
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Price (VND)
          </label>
          <input
            type="number"
            value={data.price_vnd ?? ""}
            onChange={(e) => set("price_vnd", e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={handlePriceVndBlur}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <NumberField
          label="Area"
          value={data.area_m2}
          onChange={(v) => set("area_m2", v)}
          step="0.1"
          suffix="m²"
        />
        <NumberField
          label="Price per m²"
          value={data.price_per_m2}
          onChange={(v) => set("price_per_m2", v)}
          suffix="VND"
        />
        <NumberField
          label="Rental Income"
          value={data.rental_income_vnd}
          onChange={(v) => set("rental_income_vnd", v)}
          suffix="VND/mo"
        />
        <CheckboxField
          label="Negotiable"
          value={data.negotiable}
          onChange={(v) => set("negotiable", v)}
        />
      </Section>

      <Section title="Location">
        <TextField
          label="Address (raw)"
          value={data.address_raw}
          onChange={(v) => set("address_raw", v)}
        />
        <SelectField
          label="Ward"
          value={data.ward}
          options={Object.fromEntries(NHA_TRANG_WARDS.map((w) => [w, w]))}
          onChange={(v) => set("ward", v)}
        />
        <TextField
          label="Street"
          value={data.street}
          onChange={(v) => set("street", v)}
        />
        <TextField
          label="District"
          value={data.district}
          onChange={(v) => set("district", v)}
        />
        <NumberField
          label="Latitude"
          value={data.latitude}
          onChange={(v) => set("latitude", v)}
          step="0.000001"
        />
        <NumberField
          label="Longitude"
          value={data.longitude}
          onChange={(v) => set("longitude", v)}
          step="0.000001"
        />
      </Section>

      <LocationPicker data={data} onChange={setMultiple} />

      <Section title="Dimensions">
        <NumberField
          label="Bedrooms"
          value={data.num_bedrooms}
          onChange={(v) => set("num_bedrooms", v)}
        />
        <NumberField
          label="Bathrooms"
          value={data.num_bathrooms}
          onChange={(v) => set("num_bathrooms", v)}
        />
        <NumberField
          label="Floors"
          value={data.num_floors}
          onChange={(v) => set("num_floors", v)}
        />
        <NumberField
          label="Frontage"
          value={data.frontage_m}
          onChange={(v) => set("frontage_m", v)}
          step="0.1"
          suffix="m"
        />
        <NumberField
          label="Depth"
          value={data.depth_m}
          onChange={(v) => set("depth_m", v)}
          step="0.1"
          suffix="m"
        />
        <NumberField
          label="Total Construction"
          value={data.total_construction_area}
          onChange={(v) => set("total_construction_area", v)}
          step="0.1"
          suffix="m²"
        />
        <CheckboxField
          label="Corner Lot"
          value={data.corner_lot}
          onChange={(v) => set("corner_lot", v)}
        />
      </Section>

      <Section title="Structure & Features">
        <SelectField
          label="Structure Type"
          value={data.structure_type}
          options={STRUCTURE_TYPES}
          onChange={(v) => set("structure_type", v)}
        />
        <SelectField
          label="Building Type"
          value={data.building_type}
          options={BUILDING_TYPES}
          onChange={(v) => set("building_type", v)}
        />
        <SelectField
          label="Direction"
          value={data.direction}
          options={DIRECTION_TYPES}
          onChange={(v) => set("direction", v)}
        />
        <SelectField
          label="Legal Status"
          value={data.legal_status}
          options={LEGAL_STATUS_TYPES}
          onChange={(v) => set("legal_status", v)}
        />
        <SelectField
          label="Access Road"
          value={data.access_road}
          options={ACCESS_ROAD_TYPES}
          onChange={(v) => set("access_road", v)}
        />
        <SelectField
          label="Furnished"
          value={data.furnished}
          options={FURNISHED_TYPES}
          onChange={(v) => set("furnished", v)}
        />
        <CheckboxField
          label="Has Elevator"
          value={data.has_elevator}
          onChange={(v) => set("has_elevator", v)}
        />
      </Section>

      <Section title="Extra Details">
        <TextField
          label="Feng Shui"
          value={data.feng_shui}
          onChange={(v) => set("feng_shui", v)}
        />
        <TextField
          label="Land Characteristics"
          value={data.land_characteristics}
          onChange={(v) => set("land_characteristics", v)}
        />
        <TextField
          label="Traffic / Connectivity"
          value={data.traffic_connectivity}
          onChange={(v) => set("traffic_connectivity", v)}
        />
      </Section>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-navy mb-2 pb-1 border-b border-slate-200">
          Description
        </h3>
        <textarea
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>
    </div>
  );
}
