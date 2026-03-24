"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Listing, ListingPhoto, ListingDocument, Message } from "@/lib/types";
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
  formatPrice,
  generateTitleStandardized,
} from "@/lib/constants";
import { TranslateButton } from "@/components/ui/TranslateButton";
import DynamicListingMap from "@/components/map/DynamicListingMap";
import DocumentManager from "@/components/documents/DocumentManager";
import { Link2, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getFieldValueLabel } from "@/lib/i18n";

const STATUS_FLAG_COLORS: Record<string, string | null> = {
  just_listed: "var(--info)",
  selling: null,
  price_dropped: "var(--error)",
  price_increased: "var(--error)",
  deposit: "var(--status-open)",
  sold: "var(--status-open)",
  not_for_sale: "var(--status-nfs)",
};
const STATUS_FLAG_KEYS: Record<string, "justListed" | "priceDropped" | "priceIncreased" | "deposit" | "sold" | "notForSale"> = {
  just_listed: "justListed",
  price_dropped: "priceDropped",
  price_increased: "priceIncreased",
  deposit: "deposit",
  sold: "sold",
  not_for_sale: "notForSale",
};
function StatusFlag({ status }: { status: string }) {
  const { t } = useLanguage();
  const color = STATUS_FLAG_COLORS[status];
  const key = STATUS_FLAG_KEYS[status];
  if (!color || !key) return null;
  return (
    <div
      className="absolute top-2 left-0 z-10 px-2 py-0.5 text-[9px] font-bold text-white"
      style={{ backgroundColor: color, borderRadius: "0 3px 3px 0" }}
    >
      {t(key)}
    </div>
  );
}

type ConversationWithMessages = {
  id: number;
  other_agent_name: string | null;
  other_agent_first_name: string | null;
  other_agent_username: string | null;
  other_agent_phone: string | null;
  other_agent_avatar_url: string | null;
  listing_id: number | null;
  last_message_preview: string | null;
  unread_count: number;
  messages?: Message[];
  messagesLoading?: boolean;
};

function label(
  key: string | null | undefined,
  map: Record<string, string>,
): string {
  if (!key) return "—";
  return map[key] ?? key;
}

export default function ListingViewPage() {
  return (
    <Suspense>
      <ListingViewPageInner />
    </Suspense>
  );
}

function ListingViewPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "listings";
  const { user } = useAuth();
  const { t } = useLanguage();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [documents, setDocuments] = useState<ListingDocument[]>([]);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareFormat, setShareFormat] = useState<"zalo" | "facebook">("zalo");
  const [shareTextCopied, setShareTextCopied] = useState(false);
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedConvId, setExpandedConvId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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

  // Fetch conversations after listing loads
  useEffect(() => {
    if (!listing || !user) return;
    setMessagesLoading(true);
    const isOwnerLocal = listing.agent_id === user.id;
    // Non-owner: also match conversations with the listing owner regardless of listing_id
    // (covers conversations created before listing_id was tracked)
    const convParams = isOwnerLocal
      ? `listing_id=${listing.id}`
      : `listing_id=${listing.id}&other_agent_id=${listing.agent_id}`;
    fetch(`/api/conversations?${convParams}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { conversations: [] })
      .then(async (d) => {
        const convs: ConversationWithMessages[] = d.conversations || [];
        setConversations(convs);
        // Auto-expand first conversation (most recent) and immediately fetch its messages
        if (convs.length > 0) {
          const firstId = convs[0].id;
          setExpandedConvId(firstId);
          // Fetch messages for the first conversation immediately
          try {
            const msgRes = await fetch(`/api/conversations/${firstId}/messages`, { credentials: 'include' });
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setConversations(prev => prev.map(c =>
                c.id === firstId ? { ...c, messages: msgData.messages, messagesLoading: false } : c
              ));
            }
          } catch {
            // ignore
          }
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setMessagesLoading(false));
  }, [listing?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle URL hash — scroll to messages section
  useEffect(() => {
    if (!listing) return;
    if (typeof window !== 'undefined' && window.location.hash === '#messages') {
      setTimeout(() => {
        document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [listing]);

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

  const handleMessageAgent = () => {
    document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' });
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

  const fetchConversationMessages = async (convId: number) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messagesLoading: true } : c
    ));
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, messages: data.messages, messagesLoading: false } : c
        ));
      }
    } catch {
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messagesLoading: false } : c
      ));
    }
  };

  const handleSendMessage = async (convId: number, body: string) => {
    if (!body.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), listing_id: listing?.id }),
      });
      if (res.ok) {
        await fetchConversationMessages(convId);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async (body: string) => {
    if (!body.trim() || !listing?.agent_id) return;
    setSendingMessage(true);
    try {
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          other_agent_id: listing.agent_id,
          listing_id: listing.id
        }),
      });
      if (convRes.ok) {
        const { conversation } = await convRes.json();
        // Send first message
        await fetch(`/api/conversations/${conversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: body.trim(), listing_id: listing.id }),
        });
        // Reload conversations (use same OR-based query as initial load)
        const convsRes = await fetch(`/api/conversations?listing_id=${listing.id}&other_agent_id=${listing.agent_id}`, { credentials: 'include' });
        if (convsRes.ok) {
          const d = await convsRes.json();
          const convs: ConversationWithMessages[] = d.conversations || [];
          setConversations(convs);
          if (convs.length > 0) {
            const firstId = convs[0].id;
            setExpandedConvId(firstId);
            // Fetch messages for the newly created conversation
            try {
              const msgRes = await fetch(`/api/conversations/${firstId}/messages`, { credentials: 'include' });
              if (msgRes.ok) {
                const msgData = await msgRes.json();
                setConversations(prev => prev.map(c =>
                  c.id === firstId ? { ...c, messages: msgData.messages, messagesLoading: false } : c
                ));
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } finally {
      setSendingMessage(false);
      setNewMessage("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Top actions bar — owner only */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
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
            onClick={() => setShowShareCard((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showShareCard ? "border-[var(--orange)] text-[var(--orange)]" : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
          >
            <Share2 size={16} /> {t("createPost")}
          </button>
        </div>
      )}

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

      {/* Header: two-line title + nav buttons */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0 mr-4">
          {/* Line 1: street address */}
          <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
            {listing.street || ""}
          </p>
          {/* Line 2: specs (title_standardized) */}
          <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight mt-0.5">
            {listing.title_standardized || generateTitleStandardized(listing)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
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
            <StatusFlag status={listing.status} />
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


      {/* Description card */}
      {listing.description && (
        <div className="rounded-xl p-5 border border-[var(--border)] mb-6" style={{ backgroundColor: "var(--bg-surface)" }}>
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

      {/* Key specs card */}
      <div className="rounded-xl p-5 border border-[var(--border)] mb-6" style={{ backgroundColor: "var(--bg-surface)" }}>
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

      {/* Legal & features card */}
      <div className="rounded-xl p-5 border border-[var(--border)] mb-6" style={{ backgroundColor: "var(--bg-surface)" }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
          {t("legalAndFeatures")}
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

      {/* Map — inline, always visible if lat/lng exist */}
      {listing.latitude && listing.longitude && (
        <div className="mb-6 overflow-hidden rounded-lg relative isolate">
          <DynamicListingMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            height="300px"
            popupContent={`${label(listing.property_type, PROPERTY_TYPES)} - ${formatPrice(listing.price_vnd)}`}
          />
        </div>
      )}

      {/* Documents section */}
      <div className="mb-6">
        <DocumentManager
          listingId={listing.id}
          documents={documents}
          onDocumentsChange={setDocuments}
          readOnly={!isOwner}
        />
      </div>

      {/* Agent info / contact section */}
      <div className="mb-6 rounded-xl p-5 border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
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
              {t("messageAgent")}
            </button>
          )}
        </div>
        {listing.agent_id && (
          <p className="text-sm text-[var(--text-secondary)] mt-3">
            {listing.owner_first_name || listing.owner_username || "—"}
            {listing.owner_phone && <span className="ml-3 text-[var(--text-muted)]">{listing.owner_phone}</span>}
            {listing.owner_email && <span className="ml-3 text-[var(--text-muted)]">{listing.owner_email}</span>}
          </p>
        )}
      </div>

      {/* Messages section */}
      <div id="messages" className="mt-8 rounded-xl border border-[var(--border)] overflow-hidden" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
            {t("messagesAboutListing")}
          </h3>
        </div>

        {messagesLoading ? (
          <div className="p-4 text-sm text-[var(--text-muted)] text-center">{t("loading")}</div>
        ) : isOwner ? (
          // CASE B: Owner sees all conversations as accordion
          conversations.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-muted)] text-center">{t("noInquiriesYet")}</div>
          ) : (
            <div>
              {conversations.map((conv) => {
                const isExpanded = expandedConvId === conv.id;
                const name = conv.other_agent_first_name || conv.other_agent_name || conv.other_agent_username || t("agent");
                return (
                  <div key={conv.id} className="border-b border-[var(--border)] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        const newId = isExpanded ? null : conv.id;
                        setExpandedConvId(newId);
                        if (newId && !conv.messages) fetchConversationMessages(newId);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                    >
                      {conv.other_agent_avatar_url ? (
                        <img src={`/api/files/${conv.other_agent_avatar_url}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0" style={{ backgroundColor: "var(--orange)" }}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
                        {conv.last_message_preview && (
                          <p className="text-xs text-[var(--text-muted)] truncate">{conv.last_message_preview}</p>
                        )}
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--orange)" }}>
                          {conv.unread_count}
                        </span>
                      )}
                      <span className="text-[var(--text-muted)]">{isExpanded ? '▼' : '▶'}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4">
                        {conv.messagesLoading ? (
                          <div className="py-3 text-sm text-center text-[var(--text-muted)]">{t("loading")}</div>
                        ) : (
                          <>
                            <div className="max-h-60 overflow-y-auto space-y-2 py-2">
                              {(conv.messages || []).length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)] text-center py-2">{t("noMessagesThread")}</p>
                              ) : (conv.messages || []).map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${msg.sender_id === user?.id ? 'text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'}`}
                                    style={msg.sender_id === user?.id ? { backgroundColor: "var(--orange)" } : {}}>
                                    {msg.body}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <InlineMessageInput
                              onSend={(body) => handleSendMessage(conv.id, body)}
                              sending={sendingMessage}
                              placeholder={t("typeReply")}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // CASE A: Non-owner sees single thread or "start conversation"
          <div className="p-5">
            {/* Agent info bar — always shown (REA-90) */}
            {listing.agent_id && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                {listing.owner_avatar_url ? (
                  <img src={`/api/files/${listing.owner_avatar_url}`} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0" style={{ backgroundColor: "var(--orange)" }}>
                    {(listing.owner_first_name || listing.owner_username || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {[listing.owner_first_name, listing.owner_last_name].filter(Boolean).join(" ") || listing.owner_username}
                  </p>
                  {listing.owner_phone && <p className="text-xs text-[var(--text-muted)]">{listing.owner_phone}</p>}
                </div>
              </div>
            )}
            {conversations.length === 0 ? (
              // No existing conversation — show prompt to start one
              <>
                <p className="text-sm text-[var(--text-muted)] mb-3">{t("askAboutListing")}</p>
                <InlineMessageInput
                  onSend={handleStartConversation}
                  sending={sendingMessage}
                  placeholder={t("typeFirstMessage")}
                />
              </>
            ) : (
              // Existing conversation — show messages
              <>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                  {conversations[0].messagesLoading ? (
                    <div className="text-sm text-center text-[var(--text-muted)] py-2">{t("loading")}</div>
                  ) : (conversations[0].messages || []).length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-2">{t("noMessagesThread")}</p>
                  ) : (conversations[0].messages || []).map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${msg.sender_id === user?.id ? 'text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'}`}
                        style={msg.sender_id === user?.id ? { backgroundColor: "var(--orange)" } : {}}>
                        {msg.body}
                      </div>
                    </div>
                  ))}
                </div>
                <InlineMessageInput
                  onSend={(body) => handleSendMessage(conversations[0].id, body)}
                  sending={sendingMessage}
                  placeholder={t("typeReply")}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineMessageInput({ onSend, sending, placeholder }: { onSend: (body: string) => void | Promise<void>; sending?: boolean; placeholder?: string }) {
  const [text, setText] = useState("");
  const { t } = useLanguage();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    await onSend(body);
    setText("");
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t("typeMessage")}
        rows={1}
        disabled={sending}
        className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--orange)] text-[var(--text-primary)] bg-[var(--bg-input)] placeholder:text-[var(--text-muted)]"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium"
        style={{ backgroundColor: "var(--orange)" }}
      >
        {t("send")}
      </button>
    </form>
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
