"use client";

import { useState, useEffect, useRef } from "react";
import {
  NHA_TRANG_WARDS,
  NEW_WARD_OPTIONS,
  WARD_TO_REGION,
  REGION_TO_WARDS,
  WARD_DISPLAY_NAME,
} from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { FIELD_VALUE_LABELS } from "@/lib/i18n";

export interface FeedFilterValues {
  property_type: string;
  transaction_type: string;
  ward: string;
  ward_new: string;
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
  num_bathrooms_min: string;
  corner_lot: string;
  has_elevator: string;
  negotiable: string;
  agent_id: string;
  is_favorited: string;
  sort: string;
  order: string;
}

export const DEFAULT_FILTERS: FeedFilterValues = {
  property_type: "",
  transaction_type: "",
  ward: "",
  ward_new: "",
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
  num_bathrooms_min: "",
  corner_lot: "",
  has_elevator: "",
  negotiable: "",
  agent_id: "",
  is_favorited: "",
  sort: "created_at",
  order: "desc",
};

interface AgentOption {
  id: number;
  first_name: string | null;
  username: string | null;
}

interface Props {
  filters: FeedFilterValues;
  onChange: (filters: FeedFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  onCollapse?: () => void;
  /** For Feed view: list of agents for "Agent" filter */
  agents?: AgentOption[];
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
  allLabel: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-0.5 text-[var(--text-secondary)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-2 py-1.5 text-sm"
      >
        <option value="">{allLabel}</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Convert tỷ string back to numeric tỷ value for display. "1.15ty" → 1.15, "" → null */
function parseTyValue(raw: string): number | null {
  if (!raw) return null;
  const m = raw.match(/^([\d.]+)\s*ty$/i);
  if (m) return parseFloat(m[1]);
  // Also handle plain numbers that parseVietnamesePrice would treat as triệu
  const num = parseFloat(raw);
  if (!isNaN(num) && num > 0) {
    // If raw VND-like (>=1M), convert to tỷ
    if (num >= 1_000_000) return num / 1_000_000_000;
    // Otherwise treat as triệu
    return num / 1000;
  }
  return null;
}

/** Format tỷ number for display: 1.15 → "1.15", 0.4 → "0.40" */
function formatTy(val: number): string {
  if (val >= 1) return val % 1 === 0 ? String(val) : val.toFixed(2).replace(/0$/, "");
  return val.toFixed(2).replace(/0$/, "");
}

function PriceStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const tyVal = parseTyValue(value);
  const STEP = 1; // 1 tỷ increment
  const inputRef = useRef<HTMLInputElement>(null);

  // Local text state — only syncs to parent on blur/Enter
  const [localText, setLocalText] = useState(() =>
    tyVal != null ? formatTy(tyVal) : ""
  );

  // Sync from parent when external changes happen (stepper buttons, reset)
  useEffect(() => {
    if (!inputRef.current || document.activeElement !== inputRef.current) {
      setLocalText(tyVal != null ? formatTy(tyVal) : "");
    }
  }, [tyVal]);

  const handleStep = (dir: 1 | -1) => {
    const current = tyVal ?? 0;
    const next = Math.max(0, +(current + dir * STEP).toFixed(2));
    onChange(next === 0 ? "" : `${next}ty`);
  };

  const commitValue = (raw: string) => {
    const normalized = raw.replace(",", ".");
    if (normalized === "" || normalized === ".") {
      onChange("");
      setLocalText("");
      return;
    }
    const num = parseFloat(normalized);
    if (!isNaN(num) && num >= 0) {
      onChange(`${num}ty`);
      setLocalText(formatTy(num));
    } else {
      setLocalText(tyVal != null ? formatTy(tyVal) : "");
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={!tyVal || tyVal <= 0}
          className="flex-none w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors text-lg font-medium"
        >
          −
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={localText}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "" || /^\d*[.,]?\d*$/.test(raw)) {
              setLocalText(raw);
            }
          }}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitValue((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="0"
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
        />
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="flex-none w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors text-lg font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function FeedFilters({
  filters,
  onChange,
  onApply,
  onReset,
  onCollapse,
  agents = [],
}: Props) {
  const { t, lang } = useLanguage();

  // Build translated option maps from FIELD_VALUE_LABELS
  const toOptions = (field: string): Record<string, string> =>
    Object.fromEntries(
      Object.entries(FIELD_VALUE_LABELS[field] || {}).map(([k, v]) => [k, v[lang]])
    );

  const propertyTypeOptions = toOptions("property_type");
  const transactionTypeOptions = toOptions("transaction_type");
  const directionOptions = toOptions("direction");
  const structureTypeOptions = toOptions("structure_type");
  const accessRoadOptions = toOptions("access_road");
  const furnishedOptions = toOptions("furnished");
  const buildingTypeOptions = toOptions("building_type");

  const set = (key: keyof FeedFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sort" && k !== "order",
  ).length;

  return (
    <div className="rounded-xl p-4 mb-4 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("filters")}{activeCount > 0 && ` (${activeCount})`}
        </h3>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              {t("reset")}
            </button>
          )}
        </div>
      </div>

      {/* Property Type + Transaction Type — top */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <FilterSelect
          label={t("property")}
          value={filters.property_type}
          options={propertyTypeOptions}
          onChange={(v) => set("property_type", v)}
          allLabel={t("all")}
        />
        <FilterSelect
          label={t("transaction")}
          value={filters.transaction_type}
          options={transactionTypeOptions}
          onChange={(v) => set("transaction_type", v)}
          allLabel={t("all")}
        />
      </div>

      {/* Price range — tỷ steppers */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <PriceStepper
          label={t("minPrice")}
          value={filters.price_min}
          onChange={(v) => set("price_min", v)}
        />
        <PriceStepper
          label={t("maxPrice")}
          value={filters.price_max}
          onChange={(v) => set("price_max", v)}
        />
      </div>

      {/* Bedrooms + Area */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
            {t("minBeds")}
          </label>
          <input
            type="number"
            value={filters.num_bedrooms_min}
            onChange={(e) => set("num_bedrooms_min", e.target.value)}
            placeholder={t("any")}
            min="0"
            className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
            {t("minArea")}
          </label>
          <input
            type="number"
            value={filters.area_min}
            onChange={(e) => set("area_min", e.target.value)}
            placeholder="0"
            className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
          />
        </div>
      </div>

      {/* Ward: New (region) & Old (individual) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <FilterSelect
          label={t("wardNew")}
          value={filters.ward_new}
          options={NEW_WARD_OPTIONS}
          onChange={(v) => {
            onChange({ ...filters, ward_new: v, ward: "" });
          }}
          allLabel={t("all")}
        />
        <FilterSelect
          label={t("wardOld")}
          value={filters.ward}
          options={(() => {
            const region = filters.ward_new;
            const allowed = region && REGION_TO_WARDS[region] ? REGION_TO_WARDS[region] : NHA_TRANG_WARDS as unknown as string[];
            return Object.fromEntries(allowed.map((w) => [w, WARD_DISPLAY_NAME[w] || w]));
          })()}
          onChange={(v) => {
            const region = WARD_TO_REGION[v] || "";
            onChange({ ...filters, ward: v, ward_new: region });
          }}
          allLabel={t("all")}
        />
      </div>

      {/* Extras row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        <FilterSelect
          label={t("direction")}
          value={filters.direction}
          options={directionOptions}
          onChange={(v) => set("direction", v)}
          allLabel={t("all")}
        />
        <FilterSelect
          label={t("roadAccess")}
          value={filters.access_road}
          options={accessRoadOptions}
          onChange={(v) => set("access_road", v)}
          allLabel={t("all")}
        />
        <FilterSelect
          label={t("furnished")}
          value={filters.furnished}
          options={furnishedOptions}
          onChange={(v) => set("furnished", v)}
          allLabel={t("all")}
        />
        <FilterSelect
          label={t("building")}
          value={filters.building_type}
          options={buildingTypeOptions}
          onChange={(v) => set("building_type", v)}
          allLabel={t("all")}
        />
      </div>

      {/* Extras row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <FilterSelect
          label={t("structure")}
          value={filters.structure_type}
          options={structureTypeOptions}
          onChange={(v) => set("structure_type", v)}
          allLabel={t("all")}
        />
        {agents.length > 0 && (
          <FilterSelect
            label={t("agent")}
            value={filters.agent_id}
            options={Object.fromEntries(
              agents.map((a) => [
                String(a.id),
                a.first_name || a.username || `${t("agent")} ${a.id}`,
              ])
            )}
            onChange={(v) => set("agent_id", v)}
            allLabel={t("all")}
          />
        )}
        <div className="flex flex-col gap-1.5 justify-end col-span-2 sm:col-span-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={filters.corner_lot === "true"} onChange={(e) => set("corner_lot", e.target.checked ? "true" : "")} className="rounded accent-[var(--orange)]" />
              {t("cornerLot")}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={filters.has_elevator === "true"} onChange={(e) => set("has_elevator", e.target.checked ? "true" : "")} className="rounded accent-[var(--orange)]" />
              {t("elevator")}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={filters.negotiable === "true"} onChange={(e) => set("negotiable", e.target.checked ? "true" : "")} className="rounded accent-[var(--orange)]" />
              {t("negotiable")}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={filters.is_favorited === "true"} onChange={(e) => set("is_favorited", e.target.checked ? "true" : "")} className="rounded accent-[var(--orange)]" />
              {t("favoritesOnly")}
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
        <div>
          <label className="text-xs mr-2 text-[var(--text-muted)]">{t("sortBy")}</label>
          <select
            value={`${filters.sort}-${filters.order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              onChange({ ...filters, sort: s, order: o });
            }}
            className="text-sm rounded-lg px-2 py-1"
          >
            <option value="created_at-desc">{t("newest")}</option>
            <option value="updated_at-desc">{t("recentlyUpdated")}</option>
            <option value="price_vnd-asc">{t("priceLowToHigh")}</option>
            <option value="price_vnd-desc">{t("priceHighToLow")}</option>
            <option value="area_m2-desc">{t("areaLargest")}</option>
            <option value="area_m2-asc">{t("areaSmallest")}</option>
          </select>
        </div>
        <button
          onClick={() => { onApply(); onCollapse?.(); }}
          className="px-4 py-2 text-white text-sm rounded-lg font-medium transition-colors"
          style={{ backgroundColor: "var(--orange)" }}
        >
          {t("apply")}
        </button>
      </div>
    </div>
  );
}
