import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

const PROPERTY_TYPES = ["apartment", "house", "villa", "townhouse", "land", "commercial", "shophouse", "penthouse"];
const STATUSES = ["Open", "In Negotiations", "Closing", "Sold", "Not For Sale"];
const DISTRICTS = [
  "Vĩnh Hòa", "Vĩnh Hải", "Vĩnh Phước", "Vĩnh Thọ",
  "Xương Huân", "Vạn Thắng", "Vạn Thạnh", "Phương Sài",
  "Phương Sơn", "Ngọc Hiệp", "Phước Hòa", "Phước Tân",
  "Phước Hải", "Phước Long", "Vĩnh Trường", "Vĩnh Nguyên",
  "Lộc Thọ", "Tân Lập", "Phước Tiến"
];
const DIRECTIONS = ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"];
const LEGAL_STATUSES = ["Red Book", "Pink Book", "Sales Contract", "Pending", "Other"];
const FURNISHING = ["Fully Furnished", "Partially Furnished", "Unfurnished"];
const SORT_OPTIONS = [
  { value: "-created_date", label: "Newest First" },
  { value: "created_date", label: "Oldest First" },
  { value: "-updated_date", label: "Recently Updated" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-area_sqm", label: "Area: Large to Small" },
  { value: "area_sqm", label: "Area: Small to Large" },
  { value: "-bedrooms", label: "Most Bedrooms" },
];

export default function ListingFilters({ filters, onChange, sortBy, onSortChange }) {
  const [expanded, setExpanded] = useState(false);

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value === "all" ? undefined : value });
  };

  const clearFilters = () => {
    onChange({});
  };

  const activeCount = Object.values(filters).filter(v => v !== undefined && v !== "" && v !== "all").length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 bg-gray-50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className={`gap-2 ${activeCount > 0 ? "border-teal-300 text-teal-700 bg-teal-50" : ""}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center">
                {activeCount}
              </span>
            )}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <Select value={filters.property_type || "all"} onValueChange={(v) => updateFilter("property_type", v)}>
              <SelectTrigger><SelectValue placeholder="Property Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.transaction_status || "all"} onValueChange={(v) => updateFilter("transaction_status", v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.district || "all"} onValueChange={(v) => updateFilter("district", v)}>
              <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {DISTRICTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.direction || "all"} onValueChange={(v) => updateFilter("direction", v)}>
              <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                {DIRECTIONS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.legal_status || "all"} onValueChange={(v) => updateFilter("legal_status", v)}>
              <SelectTrigger><SelectValue placeholder="Legal Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Legal</SelectItem>
                {LEGAL_STATUSES.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.furnishing || "all"} onValueChange={(v) => updateFilter("furnishing", v)}>
              <SelectTrigger><SelectValue placeholder="Furnishing" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Furnishing</SelectItem>
                {FURNISHING.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Input
                type="number"
                placeholder="Min Price ($)"
                value={filters.minPrice || ""}
                onChange={(e) => updateFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max Price ($)"
                value={filters.maxPrice || ""}
                onChange={(e) => updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-gray-50"
              />
            </div>

            <div>
              <Input
                type="number"
                placeholder="Min Bedrooms"
                value={filters.minBedrooms || ""}
                onChange={(e) => updateFilter("minBedrooms", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Min Area (m²)"
                value={filters.minArea || ""}
                onChange={(e) => updateFilter("minArea", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-gray-50"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={clearFilters} className="text-gray-500 gap-1 text-sm">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}