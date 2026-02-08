"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ListingInput } from "@/lib/validation";
import { Listing } from "@/lib/types";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  ACCESS_ROAD_TYPES,
  FURNISHED_TYPES,
  DIRECTION_TYPES,
  LEGAL_STATUS_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPES,
  formatPrice,
} from "@/lib/constants";
import FreestyleEditor from "./FreestyleEditor";
import DatabaseView from "./DatabaseView";

type Mode = "freestyle" | "database";

const EMPTY_LISTING: ListingInput = {
  property_type: null,
  transaction_type: null,
  price_raw: null,
  price_vnd: null,
  area_m2: null,
  address_raw: null,
  ward: null,
  street: null,
  district: null,
  num_bedrooms: null,
  num_floors: null,
  frontage_m: null,
  access_road: null,
  furnished: null,
  description: null,
  status: "for_sale",
  freestyle_text: null,
  legal_status: null,
  num_bathrooms: null,
  structure_type: null,
  direction: null,
  depth_m: null,
  corner_lot: false,
  price_per_m2: null,
  negotiable: false,
  rental_income_vnd: null,
  has_elevator: false,
  nearby_amenities: null,
  investment_use_case: null,
  outdoor_features: null,
  special_rooms: null,
  feng_shui: null,
  total_construction_area: null,
  land_characteristics: null,
  traffic_connectivity: null,
  building_type: null,
};

function listingToInput(listing: Listing): ListingInput {
  return {
    property_type: listing.property_type,
    transaction_type: listing.transaction_type,
    price_raw: listing.price_raw,
    price_vnd: listing.price_vnd,
    area_m2: listing.area_m2,
    address_raw: listing.address_raw,
    ward: listing.ward,
    street: listing.street,
    district: listing.district,
    num_bedrooms: listing.num_bedrooms,
    num_floors: listing.num_floors,
    frontage_m: listing.frontage_m,
    access_road: listing.access_road,
    furnished: listing.furnished,
    description: listing.description,
    status: listing.status as ListingInput["status"],
    freestyle_text: listing.freestyle_text,
    legal_status: listing.legal_status,
    num_bathrooms: listing.num_bathrooms,
    structure_type: listing.structure_type,
    direction: listing.direction,
    depth_m: listing.depth_m,
    corner_lot: listing.corner_lot,
    price_per_m2: listing.price_per_m2,
    negotiable: listing.negotiable,
    rental_income_vnd: listing.rental_income_vnd,
    has_elevator: listing.has_elevator,
    nearby_amenities: listing.nearby_amenities,
    investment_use_case: listing.investment_use_case,
    outdoor_features: listing.outdoor_features,
    special_rooms: listing.special_rooms,
    feng_shui: listing.feng_shui,
    total_construction_area: listing.total_construction_area,
    land_characteristics: listing.land_characteristics,
    traffic_connectivity: listing.traffic_connectivity,
    building_type: listing.building_type,
  };
}

function lookup(
  key: string | null | undefined,
  map: Record<string, string>,
): string | null {
  if (!key) return null;
  return map[key] ?? key;
}

/** Generate a human-readable text summary from structured listing fields. */
function formDataToText(data: ListingInput): string {
  const lines: string[] = [];

  // Title line: transaction + property type + location
  const parts: string[] = [];
  if (data.transaction_type)
    parts.push(lookup(data.transaction_type, TRANSACTION_TYPES) ?? "");
  if (data.property_type)
    parts.push(lookup(data.property_type, PROPERTY_TYPES) ?? "");
  if (data.ward) parts.push(data.ward);
  if (data.street) parts.push(data.street);
  if (parts.length > 0) lines.push(parts.join(" - "));

  // Price & Area
  const priceArea: string[] = [];
  if (data.price_vnd) priceArea.push(formatPrice(data.price_vnd));
  else if (data.price_raw) priceArea.push(data.price_raw);
  if (data.area_m2) priceArea.push(`${data.area_m2}m\u00B2`);
  if (priceArea.length > 0) lines.push(priceArea.join(", "));

  // Dimensions
  const dims: string[] = [];
  if (data.num_bedrooms) dims.push(`${data.num_bedrooms} bedrooms`);
  if (data.num_bathrooms) dims.push(`${data.num_bathrooms} bathrooms`);
  if (data.num_floors) dims.push(`${data.num_floors} floors`);
  if (data.frontage_m) dims.push(`frontage ${data.frontage_m}m`);
  if (data.depth_m) dims.push(`depth ${data.depth_m}m`);
  if (data.total_construction_area)
    dims.push(`construction ${data.total_construction_area}m\u00B2`);
  if (dims.length > 0) lines.push(dims.join(", "));

  // Features
  const feats: string[] = [];
  if (data.access_road)
    feats.push(lookup(data.access_road, ACCESS_ROAD_TYPES) ?? "");
  if (data.furnished)
    feats.push(lookup(data.furnished, FURNISHED_TYPES) ?? "");
  if (data.direction)
    feats.push(`facing ${lookup(data.direction, DIRECTION_TYPES)}`);
  if (data.structure_type)
    feats.push(lookup(data.structure_type, STRUCTURE_TYPES) ?? "");
  if (data.building_type)
    feats.push(lookup(data.building_type, BUILDING_TYPES) ?? "");
  if (data.legal_status)
    feats.push(lookup(data.legal_status, LEGAL_STATUS_TYPES) ?? "");
  if (data.corner_lot) feats.push("corner lot");
  if (data.has_elevator) feats.push("elevator");
  if (data.negotiable) feats.push("negotiable");
  if (feats.length > 0) lines.push(feats.join(", "));

  // Address
  if (data.address_raw) lines.push(data.address_raw);

  // Description (only if it adds info beyond what's already shown)
  if (data.description && !lines.some((l) => l === data.description)) {
    lines.push(data.description);
  }

  return lines.filter(Boolean).join("\n");
}

interface Props {
  existing?: Listing;
}

export default function ListingForm({ existing }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(
    existing?.freestyle_text ? "freestyle" : "database",
  );
  const [freestyleText, setFreestyleText] = useState(
    existing?.freestyle_text ?? "",
  );
  const [formData, setFormData] = useState<ListingInput>(
    existing ? listingToInput(existing) : { ...EMPTY_LISTING },
  );
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track what text was last parsed to avoid re-parsing unchanged text
  const lastParsedText = useRef<string>("");

  const handleParse = async (text?: string) => {
    const textToParse = text ?? freestyleText;
    if (!textToParse.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });
      if (!res.ok) {
        setError("Failed to parse text");
        return;
      }
      const { parsed } = await res.json();
      // Merge parsed values into form data (only non-null values override)
      const merged = { ...formData };
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== null && value !== undefined) {
          (merged as Record<string, unknown>)[key] = value;
        }
      }
      merged.freestyle_text = textToParse;
      setFormData(merged);
      lastParsedText.current = textToParse;
    } catch {
      setError("Parse request failed");
    } finally {
      setParsing(false);
    }
  };

  const switchMode = async (newMode: Mode) => {
    if (newMode === mode) return;

    if (newMode === "database" && freestyleText.trim()) {
      // Freestyle → Database: auto-parse if text changed since last parse
      if (freestyleText !== lastParsedText.current) {
        setMode(newMode);
        await handleParse();
        return;
      }
    } else if (newMode === "freestyle") {
      // Database → Freestyle: generate text from structured fields
      const generated = formDataToText(formData);
      if (generated.trim()) {
        setFreestyleText(generated);
      }
    }

    setMode(newMode);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        freestyle_text: freestyleText || null,
      };

      const url = existing
        ? `/api/listings/${existing.id}`
        : "/api/listings";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        let msg = data.error || "Failed to save listing";
        if (data.details?.fieldErrors) {
          const fields = Object.entries(data.details.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("; ");
          msg += ` (${fields})`;
        }
        setError(msg);
        return;
      }

      router.push("/dashboard/listings");
      router.refresh();
    } catch {
      setError("Save request failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex border rounded-lg overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => switchMode("freestyle")}
          disabled={parsing}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mode === "freestyle"
              ? "bg-black text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Freestyle Message
        </button>
        <button
          type="button"
          onClick={() => switchMode("database")}
          disabled={parsing}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mode === "database"
              ? "bg-black text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {parsing ? "Parsing..." : "Database View"}
        </button>
      </div>

      {mode === "freestyle" ? (
        <FreestyleEditor
          value={freestyleText}
          onChange={setFreestyleText}
          onParse={handleParse}
          isParsing={parsing}
        />
      ) : (
        <DatabaseView data={formData} onChange={setFormData} />
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || parsing}
          className="px-6 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : existing
              ? "Update Listing"
              : "Add Listing"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/listings")}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
