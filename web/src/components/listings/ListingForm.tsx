"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListingInput } from "@/lib/validation";
import { Listing, StagedPhoto, StagedDocument } from "@/lib/types";
import PhotoUploader from "@/components/photos/PhotoUploader";
import DocumentManager from "@/components/documents/DocumentManager";
import { generateCommissionDisplay } from "@/lib/constants";
import DatabaseView, { DatabaseExtras } from "./DatabaseView";
import { useLanguage } from "@/contexts/LanguageContext";

type AIResult = {
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  duplicate_warning: { found: boolean; listing_id: number | null; similarity: number };
  description_draft: string;
  follow_up_questions: Array<{ field: string; question_vi: string; question_en: string }>;
  geo_from_exif: { lat: number; lng: number } | null;
};

function parseCommission(commission: string | null): { pct: number | null; months: number | null } {
  if (!commission) return { pct: 1, months: null };
  const hh = commission.match(/^hh(\d+(?:\.\d+)?)$/i);
  if (hh) return { pct: parseFloat(hh[1]), months: null };
  const mm = commission.match(/^mm(\d+(?:\.\d+)?)$/i);
  if (mm) return { pct: null, months: parseFloat(mm[1]) };
  return { pct: 1, months: null };
}

const EMPTY_LISTING: ListingInput = {
  property_type: null,
  transaction_type: null,
  price_raw: null,
  price_vnd: null,
  area_m2: null,
  address_raw: null,
  ward: null,
  ward_new: null,
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
  latitude: null,
  longitude: null,
  commission: "hh1",
  commission_pct: 1,
  commission_months: null,
};

function listingToInput(listing: Listing): ListingInput {
  const { pct, months } = parseCommission(listing.commission);
  return {
    property_type: listing.property_type,
    transaction_type: listing.transaction_type,
    price_raw: listing.price_raw ?? null,
    price_vnd: listing.price_vnd,
    area_m2: listing.area_m2,
    address_raw: listing.address_raw,
    ward: listing.ward,
    ward_new: listing.ward_new ?? null,
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
    price_per_m2: listing.price_per_m2 ??
      (listing.price_vnd && listing.area_m2 && listing.area_m2 > 0
        ? Math.round(listing.price_vnd / listing.area_m2)
        : null),
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
    latitude: listing.latitude,
    longitude: listing.longitude,
    commission: listing.commission ?? "hh1",
    commission_pct: listing.commission_pct ?? pct,
    commission_months: listing.commission_months ?? months,
  };
}

interface Props {
  existing?: Listing;
  initialData?: Partial<ListingInput>;
}

export default function ListingForm({ existing, initialData }: Props) {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [formData, setFormData] = useState<ListingInput>(
    existing ? listingToInput(existing) : { ...EMPTY_LISTING, ...initialData }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [stagedDocuments, setStagedDocuments] = useState<StagedDocument[]>([]);

  // AI parse state
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const initialDataKey = initialData ? JSON.stringify(initialData) : "";
  useEffect(() => {
    if (!existing && initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [existing, initialDataKey]);

  const handleParseWithAI = async () => {
    const text = formData.description?.trim();
    if (!text) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, existingListings: [] }),
      });
      if (!res.ok) {
        setParseError(t("parseFailed"));
        return;
      }
      const data: AIResult = await res.json();
      setAiResult(data);
      // Merge AI fields into formData (keep description as-is)
      const merged = { ...formData };
      for (const [k, v] of Object.entries(data.fields)) {
        if (v !== null && v !== undefined && k in EMPTY_LISTING) {
          (merged as Record<string, unknown>)[k] = v;
        }
      }
      const commStr = (data.fields.commission ?? null) as string | null;
      if (commStr) {
        const { pct, months } = parseCommission(commStr);
        merged.commission = commStr;
        merged.commission_pct = pct;
        merged.commission_months = months;
      }
      setFormData(merged);
    } catch {
      setParseError(t("requestFailed"));
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Ensure commission string is in sync before saving
      const payload: ListingInput = {
        ...formData,
        commission: generateCommissionDisplay(formData.commission_pct, formData.commission_months),
      };

      const url = existing ? `/api/listings/${existing.id}` : "/api/listings";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
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

      if (!existing && (stagedPhotos.length > 0 || stagedDocuments.length > 0)) {
        const newListingId = data.listing?.id;
        if (newListingId) {
          for (const staged of stagedPhotos) {
            await fetch(`/api/listings/${newListingId}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_path: staged.file_path,
                original_name: staged.original_name,
                file_size: staged.file_size,
              }),
            });
          }
          for (const staged of stagedDocuments) {
            await fetch(`/api/listings/${newListingId}/documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_path: staged.file_path,
                file_name: staged.file_name,
                original_name: staged.original_name,
                file_size: staged.file_size,
                mime_type: staged.mime_type,
                category: staged.category,
                notes: staged.notes,
              }),
            });
          }
        }
      }

      router.push("/dashboard/listings");
      router.refresh();
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div
          className="mb-4 p-3 text-sm rounded-lg border"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "var(--error)", color: "var(--error)" }}
        >
          {error}
        </div>
      )}

      {/* ── Step 1: Description + AI Parse ── */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          {lang === "vi" ? "Mô tả / Nguồn dữ liệu thô" : "Description / Raw Source Text"}
        </label>
        <textarea
          value={formData.description ?? ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value || null }))}
          placeholder={lang === "vi"
            ? "Dán nội dung BĐS ở đây rồi nhấn \"Phân tích bằng AI\"…"
            : "Paste listing text here, then tap \"Parse with AI\"…"}
          rows={5}
          className="w-full rounded-xl p-3 text-sm resize-y border border-[var(--border)]"
          style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)" }}
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleParseWithAI}
            disabled={parsing || !formData.description?.trim()}
            className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium transition-colors"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {parsing
              ? (lang === "vi" ? "Đang phân tích..." : "Analyzing...")
              : (lang === "vi" ? "Phân tích bằng AI" : "Parse with AI")}
          </button>
          {parseError && <span className="text-sm text-[var(--error)]">{parseError}</span>}
          {aiResult?.duplicate_warning?.found && (
            <span className="text-sm text-amber-500">
              {lang === "vi" ? "Có thể trùng BĐS đã có" : "Possible duplicate"}
            </span>
          )}
        </div>
      </div>

      {/* ── Steps 2-10: Core form fields ── */}
      <DatabaseView data={formData} onChange={setFormData} isEdit={!!existing} />

      {/* ── Step 11: Photo uploader ── */}
      {!existing ? (
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{t("photos")}</p>
          <PhotoUploader
            stagedPhotos={stagedPhotos}
            onStagedPhotosChange={setStagedPhotos}
          />
        </div>
      ) : null}

      {/* ── Step 12: Document uploader ── */}
      {!existing ? (
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{t("documents")}</p>
          <DocumentManager
            stagedDocuments={stagedDocuments}
            onStagedDocumentsChange={setStagedDocuments}
          />
        </div>
      ) : null}

      {/* ── Step 13: Extras ── */}
      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {lang === "vi" ? "Chi tiết thêm" : "Extra Details"}
        </p>
        <DatabaseExtras data={formData} onChange={setFormData} />
      </div>

      {/* ── Save / Cancel ── */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-white text-sm rounded-lg disabled:opacity-50 font-medium transition-colors"
          style={{ backgroundColor: "var(--orange)" }}
        >
          {saving ? t("saving") : existing ? t("updateListing") : t("addListing")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/listings")}
          className="px-4 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
