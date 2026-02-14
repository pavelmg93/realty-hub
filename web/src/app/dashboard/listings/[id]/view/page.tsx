"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Listing, ListingPhoto, ListingDocument } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  ACCESS_ROAD_TYPES,
  FURNISHED_TYPES,
  DIRECTION_TYPES,
  LEGAL_STATUS_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPES,
  DOCUMENT_CATEGORIES,
  formatPrice,
} from "@/lib/constants";
import StatusBadge from "@/components/listings/StatusBadge";
import DynamicListingMap from "@/components/map/DynamicListingMap";
import PhotoUploader from "@/components/photos/PhotoUploader";
import DocumentManager from "@/components/documents/DocumentManager";

function label(
  key: string | null | undefined,
  map: Record<string, string>,
): string {
  if (!key) return "—";
  return map[key] ?? key;
}

export default function ListingViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [documents, setDocuments] = useState<ListingDocument[]>([]);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "photos" | "documents" | "map">("details");
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    setActivePhotoIdx(0);
    async function fetchData() {
      try {
        const [listingRes, photosRes, docsRes] = await Promise.all([
          fetch(`/api/listings/${id}`, { cache: "no-store" }),
          fetch(`/api/listings/${id}/photos`),
          fetch(`/api/listings/${id}/documents`),
        ]);

        if (!listingRes.ok) {
          setError(
            listingRes.status === 404
              ? "Listing not found"
              : "Failed to load listing",
          );
        } else {
          const data = await listingRes.json();
          setListing(data.listing);
          // Fetch adjacent listing IDs for prev/next navigation
          const adjRes = await fetch(`/api/listings/${id}/adjacent`);
          if (adjRes.ok) {
            const adj = await adjRes.json();
            setAdjacentIds(adj);
          }
        }

        if (photosRes.ok) {
          const data = await photosRes.json();
          setPhotos(data.photos);
        }
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents);
        }
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">Loading...</div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Listing not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-600 hover:text-slate-800"
        >
          Go back
        </button>
      </div>
    );
  }

  const isOwner = listing.agent_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={listing.status} />
            <span className="text-xs text-slate-400">#{listing.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-navy">
            {label(listing.property_type, PROPERTY_TYPES)} -{" "}
            {label(listing.transaction_type, TRANSACTION_TYPES)}
          </h1>
          {(listing.street || listing.ward) && (
            <p className="text-slate-500 mt-1">
              {[listing.address_raw || listing.street, listing.ward]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {adjacentIds.prev && (
            <button
              onClick={() => router.push(`/dashboard/listings/${adjacentIds.prev}/view`)}
              className="px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="Previous listing"
            >
              &larr; Prev
            </button>
          )}
          {adjacentIds.next && (
            <button
              onClick={() => router.push(`/dashboard/listings/${adjacentIds.next}/view`)}
              className="px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="Next listing"
            >
              Next &rarr;
            </button>
          )}
          {isOwner && (
            <button
              onClick={() =>
                router.push(`/dashboard/listings/${listing.id}/edit`)
              }
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Photo carousel */}
      {photos.length > 0 && (
        <div className="mb-6">
          <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden mb-3">
            <img
              src={`/api/files/${photos[activePhotoIdx]?.file_path}`}
              alt={photos[activePhotoIdx]?.original_name || ""}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors text-lg"
                >
                  &lt;
                </button>
                <button
                  onClick={() => setActivePhotoIdx((i) => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors text-lg"
                >
                  &gt;
                </button>
              </>
            )}
            <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 bg-black/60 text-white rounded-full">
              {activePhotoIdx + 1} / {photos.length}
            </span>
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`aspect-square bg-slate-100 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activePhotoIdx ? "border-navy" : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <img
                    src={`/api/files/${photo.file_path}`}
                    alt={photo.original_name || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price banner */}
      {listing.price_vnd && (
        <div className="bg-navy/5 rounded-xl p-4 mb-6">
          <p className="text-3xl font-bold text-navy">
            {formatPrice(listing.price_vnd)}
          </p>
          {listing.price_raw && listing.price_raw !== formatPrice(listing.price_vnd) && (
            <p className="text-sm text-slate-500 mt-1">{listing.price_raw}</p>
          )}
          {listing.price_per_m2 && (
            <p className="text-sm text-slate-500 mt-1">
              {formatPrice(listing.price_per_m2)}/m²
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {(
          [
            { key: "details", label: "Details" },
            { key: "photos", label: `Photos (${photos.length})` },
            { key: "documents", label: `Documents (${documents.length})` },
            { key: "map", label: "Map" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property specs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
              Property
            </h3>
            <div className="space-y-3">
              <Row label="Area" value={listing.area_m2 ? `${listing.area_m2}m²` : null} />
              <Row label="Bedrooms" value={listing.num_bedrooms?.toString()} />
              <Row label="Bathrooms" value={listing.num_bathrooms?.toString()} />
              <Row label="Floors" value={listing.num_floors?.toString()} />
              <Row label="Frontage" value={listing.frontage_m ? `${listing.frontage_m}m` : null} />
              <Row label="Depth" value={listing.depth_m ? `${listing.depth_m}m` : null} />
              <Row label="Construction" value={listing.total_construction_area ? `${listing.total_construction_area}m²` : null} />
              <Row label="Direction" value={label(listing.direction, DIRECTION_TYPES)} />
              <Row label="Structure" value={label(listing.structure_type, STRUCTURE_TYPES)} />
              <Row label="Building" value={label(listing.building_type, BUILDING_TYPES)} />
              <Row label="Corner Lot" value={listing.corner_lot ? "Yes" : null} />
              <Row label="Elevator" value={listing.has_elevator ? "Yes" : null} />
            </div>
          </div>

          {/* Legal & features */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
              Details
            </h3>
            <div className="space-y-3">
              <Row label="Legal Status" value={label(listing.legal_status, LEGAL_STATUS_TYPES)} />
              <Row label="Access Road" value={label(listing.access_road, ACCESS_ROAD_TYPES)} />
              <Row label="Furnished" value={label(listing.furnished, FURNISHED_TYPES)} />
              <Row label="Negotiable" value={listing.negotiable ? "Yes" : null} />
              <Row label="Rental Income" value={listing.rental_income_vnd ? formatPrice(listing.rental_income_vnd) + "/month" : null} />
              <Row label="Land" value={listing.land_characteristics} />
              <Row label="Traffic" value={listing.traffic_connectivity} />
              <Row label="Feng Shui" value={listing.feng_shui} />
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Agent info */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">
              Contact
            </h3>
            <p className="text-sm text-slate-600">
              {listing.owner_first_name || listing.owner_username || "—"}
              {listing.owner_phone && (
                <span className="ml-3 text-slate-400">
                  {listing.owner_phone}
                </span>
              )}
              {listing.owner_email && (
                <span className="ml-3 text-slate-400">
                  {listing.owner_email}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {activeTab === "photos" && (
        <PhotoUploader
          listingId={listing.id}
          photos={photos}
          onPhotosChange={setPhotos}
          readOnly={!isOwner}
        />
      )}

      {activeTab === "documents" && (
        <DocumentManager
          listingId={listing.id}
          documents={documents}
          onDocumentsChange={setDocuments}
          readOnly={!isOwner}
        />
      )}

      {activeTab === "map" && (
        <DynamicListingMap
          latitude={listing.latitude}
          longitude={listing.longitude}
          height="400px"
          popupContent={`${label(listing.property_type, PROPERTY_TYPES)} - ${formatPrice(listing.price_vnd)}`}
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}
