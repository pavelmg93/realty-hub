"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  generateTitleStandardized,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { TranslateButton } from "@/components/ui/TranslateButton";
import DynamicListingMap from "@/components/map/DynamicListingMap";
import PhotoUploader from "@/components/photos/PhotoUploader";
import DocumentManager from "@/components/documents/DocumentManager";
import { MessageCircle, Link2, Archive, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getFieldValueLabel } from "@/lib/i18n";

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
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "listings";
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [documents, setDocuments] = useState<ListingDocument[]>([]);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "photos" | "documents" | "map">("details");
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareFormat, setShareFormat] = useState<"zalo" | "facebook">("zalo");
  const [shareTextCopied, setShareTextCopied] = useState(false);

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
          // Fetch adjacent listing IDs for prev/next navigation (scope=mine when in My Listings)
          const adjRes = await fetch(
            `/api/listings/${id}/adjacent${fromParam === "listings" ? "?scope=mine" : ""}`
          );
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
      <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12 p-3">
        <p className="text-[var(--error)] mb-4">{error || t("notFound")}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[var(--text-secondary)] hover:text-white"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  const isOwner = listing.agent_id === user?.id;

  const hasConversation = !!listing.existing_conversation_id;
  const conversationId = listing.existing_conversation_id ?? null;

  const handleMessageAgent = () => {
    if (!listing.agent_id) return;
    if (conversationId) {
      router.push(`/dashboard/messages/${conversationId}`);
      return;
    }
    // No existing thread: open new-message page; thread is created only when user sends first message
    router.push(
      `/dashboard/messages/new?listing_id=${listing.id}&agent_id=${listing.agent_id}`
    );
  };

  const handleShareLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    void navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const generateShareText = (format: "zalo" | "facebook"): string => {
    if (!listing) return "";
    const parts: string[] = [];
    const propLabel = getFieldValueLabel("property_type", listing.property_type, "vi") || label(listing.property_type, PROPERTY_TYPES);
    const txnLabel = getFieldValueLabel("transaction_type", listing.transaction_type, "vi") || label(listing.transaction_type, TRANSACTION_TYPES);
    const priceStr = listing.price_raw || (listing.price_vnd ? formatPrice(listing.price_vnd) : "");
    const area = listing.area_m2 ? `${listing.area_m2}m²` : "";
    const ward = listing.ward ? `P. ${listing.ward}` : "";
    const street = listing.street || "";
    const address = listing.address_raw || [street, ward].filter(Boolean).join(", ");

    if (format === "zalo") {
      parts.push(`🏠 ${propLabel} ${txnLabel}`.trim());
      if (address) parts.push(`📍 ${address}`);
      if (priceStr) parts.push(`💰 ${priceStr}`);
      if (area) parts.push(`📐 ${area}`);
      const specs: string[] = [];
      if (listing.num_bedrooms) specs.push(`${listing.num_bedrooms} PN`);
      if (listing.num_bathrooms) specs.push(`${listing.num_bathrooms} WC`);
      if (listing.num_floors) specs.push(`${listing.num_floors} tầng`);
      if (specs.length) parts.push(`🏗 ${specs.join(" • ")}`);
      if (listing.description) parts.push(`\n${listing.description.slice(0, 200)}`);
      const contact = listing.owner_phone || listing.owner_email || "";
      if (contact) parts.push(`\n📞 ${contact}`);
    } else {
      // Facebook — more detail + hashtags
      parts.push(`🏠 ${propLabel.toUpperCase()} — ${txnLabel.toUpperCase()}`);
      if (address) parts.push(`📍 ${address}`);
      if (priceStr) parts.push(`💰 Giá: ${priceStr}${listing.negotiable ? " (thương lượng)" : ""}`);
      if (area) parts.push(`📐 Diện tích: ${area}`);
      const specs: string[] = [];
      if (listing.num_bedrooms) specs.push(`${listing.num_bedrooms} phòng ngủ`);
      if (listing.num_bathrooms) specs.push(`${listing.num_bathrooms} WC`);
      if (listing.num_floors) specs.push(`${listing.num_floors} tầng`);
      if (listing.frontage_m) specs.push(`mặt tiền ${listing.frontage_m}m`);
      if (specs.length) parts.push(`🏗 ${specs.join(" • ")}`);
      const features: string[] = [];
      if (listing.access_road) features.push(label(listing.access_road, ACCESS_ROAD_TYPES));
      if (listing.furnished && listing.furnished !== "khong") features.push(label(listing.furnished, FURNISHED_TYPES));
      if (listing.legal_status) features.push(label(listing.legal_status, LEGAL_STATUS_TYPES));
      if (listing.has_elevator) features.push("Có thang máy");
      if (features.length) parts.push(`✅ ${features.join(" • ")}`);
      if (listing.description) parts.push(`\n📝 ${listing.description.slice(0, 300)}`);
      const contact = listing.owner_phone || listing.owner_email || "";
      if (contact) parts.push(`\n📞 Liên hệ: ${contact}`);
      const tags = ["#batdongsan", "#nhatrang", "#khanhhoa",
        listing.transaction_type === "ban" ? "#banbatdongsan" : "#chothuenha",
        ward ? `#${ward.replace(/\s+/g, "").toLowerCase()}` : ""
      ].filter(Boolean);
      parts.push(`\n${tags.join(" ")}`);
    }

    return parts.join("\n");
  };

  const handleCopyShareText = () => {
    const text = generateShareText(shareFormat);
    void navigator.clipboard.writeText(text).then(() => {
      setShareTextCopied(true);
      setTimeout(() => setShareTextCopied(false), 2000);
    });
  };

  const handleArchive = async () => {
    const res = await fetch(`/api/listings/${listing.id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: true }),
    });
    if (res.ok) router.push("/dashboard/listings");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Top actions: Archive, Edit, Create post (Message + Share moved to bottom) */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/listings/${listing.id}/edit`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: "var(--orange)" }}
            >
              {t("edit")}
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              <Archive size={16} /> {t("archive")}
            </button>
            <button
              type="button"
              onClick={() => setShowShareCard((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showShareCard ? "border-[var(--orange)] text-[var(--orange)]" : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
            >
              <Share2 size={16} /> {t("createPost")}
            </button>
          </>
        )}
      </div>

      {/* Share card panel */}
      {showShareCard && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">{t("shareText") || "Chia sẻ văn bản"}</span>
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              {(["zalo", "facebook"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setShareFormat(fmt)}
                  className="px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: shareFormat === fmt ? "var(--orange)" : "transparent",
                    color: shareFormat === fmt ? "white" : "var(--text-secondary)",
                  }}
                >
                  {fmt === "zalo" ? "Zalo" : "Facebook"}
                </button>
              ))}
            </div>
          </div>
          <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-elevated)] rounded-lg p-3 mb-3 max-h-48 overflow-y-auto font-sans">
            {generateShareText(shareFormat)}
          </pre>
          <button
            type="button"
            onClick={handleCopyShareText}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {shareTextCopied ? `✓ ${t("copied")}` : `📋 ${t("copyText")}`}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={listing.status as "for_sale"} />
            <span className="text-xs text-[var(--text-muted)]">#{listing.id}</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
            {listing.address_raw || [listing.street, listing.ward].filter(Boolean).join(", ") || `${label(listing.property_type, PROPERTY_TYPES)} — ${label(listing.transaction_type, TRANSACTION_TYPES)}`}
          </h1>
          <p className="text-xl font-bold text-[var(--text-primary)] leading-tight mt-0.5">
            {listing.title_standardized || generateTitleStandardized(listing)}
          </p>
        </div>
        <div className="flex gap-2">
          {adjacentIds.prev && (
            <button
              onClick={() => router.push(`/dashboard/listings/${adjacentIds.prev}/view?from=${fromParam}`)}
              className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={t("prev")}
            >
              &larr; {t("prev")}
            </button>
          )}
          {adjacentIds.next && (
            <button
              onClick={() => router.push(`/dashboard/listings/${adjacentIds.next}/view?from=${fromParam}`)}
              className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={t("next")}
            >
              {t("next")} &rarr;
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {t("back")}
          </button>
        </div>
      </div>

      {/* Photo carousel */}
      {photos.length > 0 && (
        <div className="mb-6">
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3" style={{ backgroundColor: "var(--bg-elevated)" }}>
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
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activePhotoIdx ? "" : "border-transparent hover:border-[var(--border)]"
                  }`}
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    ...(idx === activePhotoIdx ? { borderColor: "var(--orange)" } : {}),
                  }}
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
        <div className="rounded-xl p-4 mb-6 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
          <PriceDisplay vnd={listing.price_vnd} size="lg" showUsd />
          {listing.price_raw && listing.price_raw !== formatPrice(listing.price_vnd) && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{listing.price_raw}</p>
          )}
          {listing.price_per_m2 && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {formatPrice(listing.price_per_m2)}/m²
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] mb-6">
        {(
          [
            { key: "details", label: t("details") },
            { key: "photos", label: `${t("photos")} (${photos.length})` },
            { key: "documents", label: `${t("documents")} (${documents.length})` },
            { key: "map", label: t("map") },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-[var(--orange)] text-[var(--orange)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
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
          <div className="rounded-xl p-5 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
              {t("property")}
            </h3>
            <div className="space-y-3">
              <Row label={t("area")} value={listing.area_m2 ? `${listing.area_m2}m²` : null} />
              <Row label={t("bedrooms")} value={listing.num_bedrooms?.toString()} />
              <Row label={t("bathrooms")} value={listing.num_bathrooms?.toString()} />
              <Row label={t("floors")} value={listing.num_floors?.toString()} />
              <Row label={t("frontage")} value={listing.frontage_m ? `${listing.frontage_m}m` : null} />
              <Row label={t("depth")} value={listing.depth_m ? `${listing.depth_m}m` : null} />
              <Row label={t("construction")} value={listing.total_construction_area ? `${listing.total_construction_area}m²` : null} />
              <Row label={t("direction")} value={label(listing.direction, DIRECTION_TYPES)} />
              <Row label={t("structure")} value={label(listing.structure_type, STRUCTURE_TYPES)} />
              <Row label={t("building")} value={label(listing.building_type, BUILDING_TYPES)} />
              <Row label={t("cornerLot")} value={listing.corner_lot ? t("yes") : null} />
              <Row label={t("elevator")} value={listing.has_elevator ? t("yes") : null} />
            </div>
          </div>

          {/* Legal & features */}
          <div className="rounded-xl p-5 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
              {t("details")}
            </h3>
            <div className="space-y-3">
              <Row label={t("legalStatus")} value={label(listing.legal_status, LEGAL_STATUS_TYPES)} />
              <Row label={t("accessRoad")} value={label(listing.access_road, ACCESS_ROAD_TYPES)} />
              <Row label={t("furnished")} value={label(listing.furnished, FURNISHED_TYPES)} />
              <Row label={t("negotiable")} value={listing.negotiable ? t("yes") : null} />
              <Row label={t("rentalIncome")} value={listing.rental_income_vnd ? formatPrice(listing.rental_income_vnd) + "/month" : null} />
              <Row label={t("land")} value={listing.land_characteristics} />
              <Row label={t("traffic")} value={listing.traffic_connectivity} />
              <Row label={t("fengShui")} value={listing.feng_shui} />
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="md:col-span-2 rounded-xl p-5 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
                {t("description")}
              </h3>
              <div className="mb-2">
                <TranslateButton text={listing.description} onTranslated={setTranslatedDesc} />
              </div>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                {listing.description}
              </p>
              {translatedDesc && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{t("translated")}</p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{translatedDesc}</p>
                </div>
              )}
            </div>
          )}
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

      {/* Bottom: Share private link + Contact / Message */}
      <div className="mt-8 pt-6 border-t border-[var(--border)] rounded-xl p-5" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Link2 size={18} /> {shareCopied ? t("copied") : t("sharePrivateLink")}
          </button>
          {!isOwner && listing.agent_id && (
            <button
              type="button"
              onClick={handleMessageAgent}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--info)]/40 text-[var(--info)] bg-transparent hover:bg-[var(--info)]/10 transition-colors"
            >
              <MessageCircle size={18} /> {hasConversation ? t("viewMessages") : t("messageAgent")}
            </button>
          )}
        </div>
        {!isOwner && listing.agent_id && (
          <p className="text-sm text-[var(--text-secondary)] mt-3">
            {listing.owner_first_name || listing.owner_username || "—"}
            {listing.owner_phone && <span className="ml-3 text-[var(--text-muted)]">{listing.owner_phone}</span>}
            {listing.owner_email && <span className="ml-3 text-[var(--text-muted)]">{listing.owner_email}</span>}
          </p>
        )}
      </div>
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
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
