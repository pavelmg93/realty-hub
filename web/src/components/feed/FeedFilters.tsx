"use client";

import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  NHA_TRANG_WARDS,
  LISTING_STATUSES,
  LEGAL_STATUS_TYPES,
  DIRECTION_TYPES,
  STRUCTURE_TYPES,
  ACCESS_ROAD_TYPES,
  FURNISHED_TYPES,
  BUILDING_TYPES,
} from "@/lib/constants";

export interface FeedFilterValues {
  property_type: string;
  transaction_type: string;
  ward: string;
  status: string;
  legal_status: string;
  direction: string;
  structure_type: string;
  access_road: string;
  furnished: string;
  building_type: string;
  price_min: string;
  price_max: string;
  area_min: string;
  area_max: string;
  num_bedrooms_min: string;
  corner_lot: string;
  has_elevator: string;
  negotiable: string;
  sort: string;
  order: string;
}

export const DEFAULT_FILTERS: FeedFilterValues = {
  property_type: "",
  transaction_type: "",
  ward: "",
  status: "",
  legal_status: "",
  direction: "",
  structure_type: "",
  access_road: "",
  furnished: "",
  building_type: "",
  price_min: "",
  price_max: "",
  area_min: "",
  area_max: "",
  num_bedrooms_min: "",
  corner_lot: "",
  has_elevator: "",
  negotiable: "",
  sort: "created_at",
  order: "desc",
};

interface Props {
  filters: FeedFilterValues;
  onChange: (filters: FeedFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1.5 text-sm bg-white"
      >
        <option value="">All</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FeedFilters({
  filters,
  onChange,
  onApply,
  onReset,
}: Props) {
  const set = (key: keyof FeedFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sort" && k !== "order",
  ).length;

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Filters{activeCount > 0 && ` (${activeCount})`}
        </h3>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <FilterSelect
          label="Property"
          value={filters.property_type}
          options={PROPERTY_TYPES}
          onChange={(v) => set("property_type", v)}
        />
        <FilterSelect
          label="Transaction"
          value={filters.transaction_type}
          options={TRANSACTION_TYPES}
          onChange={(v) => set("transaction_type", v)}
        />
        <FilterSelect
          label="Ward"
          value={filters.ward}
          options={Object.fromEntries(NHA_TRANG_WARDS.map((w) => [w, w]))}
          onChange={(v) => set("ward", v)}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={Object.fromEntries(
            Object.entries(LISTING_STATUSES).map(([k, v]) => [k, v.label]),
          )}
          onChange={(v) => set("status", v)}
        />
        <FilterSelect
          label="Legal"
          value={filters.legal_status}
          options={LEGAL_STATUS_TYPES}
          onChange={(v) => set("legal_status", v)}
        />
        <FilterSelect
          label="Direction"
          value={filters.direction}
          options={DIRECTION_TYPES}
          onChange={(v) => set("direction", v)}
        />
        <FilterSelect
          label="Structure"
          value={filters.structure_type}
          options={STRUCTURE_TYPES}
          onChange={(v) => set("structure_type", v)}
        />
        <FilterSelect
          label="Road Access"
          value={filters.access_road}
          options={ACCESS_ROAD_TYPES}
          onChange={(v) => set("access_road", v)}
        />
        <FilterSelect
          label="Furnished"
          value={filters.furnished}
          options={FURNISHED_TYPES}
          onChange={(v) => set("furnished", v)}
        />
        <FilterSelect
          label="Building"
          value={filters.building_type}
          options={BUILDING_TYPES}
          onChange={(v) => set("building_type", v)}
        />
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Min Price (VND)
          </label>
          <input
            type="number"
            value={filters.price_min}
            onChange={(e) => set("price_min", e.target.value)}
            placeholder="0"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Max Price (VND)
          </label>
          <input
            type="number"
            value={filters.price_max}
            onChange={(e) => set("price_max", e.target.value)}
            placeholder="Any"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Min Area (m²)
          </label>
          <input
            type="number"
            value={filters.area_min}
            onChange={(e) => set("area_min", e.target.value)}
            placeholder="0"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Max Area (m²)
          </label>
          <input
            type="number"
            value={filters.area_max}
            onChange={(e) => set("area_max", e.target.value)}
            placeholder="Any"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Min Beds
          </label>
          <input
            type="number"
            value={filters.num_bedrooms_min}
            onChange={(e) => set("num_bedrooms_min", e.target.value)}
            placeholder="Any"
            min="0"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={filters.corner_lot === "true"}
              onChange={(e) =>
                set("corner_lot", e.target.checked ? "true" : "")
              }
              className="rounded"
            />
            Corner Lot
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={filters.has_elevator === "true"}
              onChange={(e) =>
                set("has_elevator", e.target.checked ? "true" : "")
              }
              className="rounded"
            />
            Elevator
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={filters.negotiable === "true"}
              onChange={(e) =>
                set("negotiable", e.target.checked ? "true" : "")
              }
              className="rounded"
            />
            Negotiable
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div>
          <label className="text-xs text-gray-500 mr-2">Sort by:</label>
          <select
            value={`${filters.sort}-${filters.order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              onChange({ ...filters, sort: s, order: o });
            }}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value="created_at-desc">Newest</option>
            <option value="updated_at-desc">Recently Updated</option>
            <option value="price_vnd-asc">Price: Low to High</option>
            <option value="price_vnd-desc">Price: High to Low</option>
            <option value="area_m2-desc">Area: Largest</option>
            <option value="area_m2-asc">Area: Smallest</option>
          </select>
        </div>
        <button
          onClick={onApply}
          className="px-4 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
