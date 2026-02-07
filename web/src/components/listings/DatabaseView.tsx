"use client";

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
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full border rounded px-2 py-1.5 text-sm bg-white"
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
      <label className="block text-xs font-medium text-gray-500 mb-1">
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
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
        {suffix && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
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
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full border rounded px-2 py-1.5 text-sm"
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
        className="rounded"
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
      <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

export default function DatabaseView({ data, onChange }: Props) {
  const set = (field: keyof ListingInput, value: unknown) => {
    onChange({ ...data, [field]: value });
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
        <TextField
          label="Price (raw text)"
          value={data.price_raw}
          onChange={(v) => set("price_raw", v)}
        />
        <NumberField
          label="Price (VND)"
          value={data.price_vnd}
          onChange={(v) => set("price_vnd", v)}
        />
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
      </Section>

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
        <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">
          Description
        </h3>
        <textarea
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          rows={3}
          className="w-full border rounded px-2 py-1.5 text-sm resize-y"
        />
      </div>
    </div>
  );
}
