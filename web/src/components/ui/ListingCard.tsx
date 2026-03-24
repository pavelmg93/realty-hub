"use client";

import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { AgentChip } from "./AgentChip";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateTitleStandardized } from "@/lib/constants";
import { MessageSquare, Heart, MapPin, User, Phone } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing & {
    has_conversation?: boolean;
    is_owner?: boolean;
  };
  cols?: 1 | 2 | 3;
  /** e.g. "?from=feed" so bottom nav stays on Feed when viewing this listing */
  viewSearch?: string;
  onMessage?: () => void;
  onViewMessages?: () => void;
  /** Called before navigating to listing detail (e.g. to save scroll position) */
  onBeforeNavigate?: () => void;
}

// Corner flag colors per status (spec REA-69/73):
// Blue=Just Listed, Red=Price Raised/Dropped, Green=Deposit/Sold, Gray=Not For Sale
// Selling has NO flag
const STATUS_FLAG_COLORS: Record<string, string | null> = {
  just_listed: "var(--info)",
  selling: null,
  price_dropped: "var(--error)",
  price_increased: "var(--error)",
  deposit: "var(--status-open)",
  sold: "var(--status-open)",
  not_for_sale: "var(--status-nfs)",
};

function Building2Icon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  );
}

/** Corner flag overlay on top-left of a photo area */
function StatusFlag({ status }: { status: string }) {
  const { t } = useLanguage();
  const color = STATUS_FLAG_COLORS[status];
  if (!color) return null;

  const STATUS_FLAG_KEYS: Record<string, "justListed" | "priceDropped" | "priceIncreased" | "deposit" | "sold" | "notForSale"> = {
    just_listed: "justListed",
    price_dropped: "priceDropped",
    price_increased: "priceIncreased",
    deposit: "deposit",
    sold: "sold",
    not_for_sale: "notForSale",
  };
  const key = STATUS_FLAG_KEYS[status];
  if (!key) return null;

  return (
    <div
      className="absolute top-2 left-0 z-10 px-2 py-0.5 text-[9px] font-bold text-white"
      style={{ backgroundColor: color, borderRadius: "0 3px 3px 0" }}
    >
      {t(key)}
    </div>
  );
}

export function ListingCard({
  listing,
  cols = 2,
  viewSearch = "",
  onMessage,
  onViewMessages,
  onBeforeNavigate,
}: ListingCardProps) {
  const { t } = useLanguage();
  const photoUrl = listing.primary_photo
    ? `/api/files/${listing.primary_photo}`
    : null;
  const agent =
    listing.agent_id != null
      ? {
          id: listing.agent_id,
          first_name: listing.owner_first_name ?? null,
          last_name: listing.owner_last_name ?? null,
          username: listing.owner_username ?? null,
          phone: listing.owner_phone ?? null,
          avatar_url: listing.owner_avatar_url ?? null,
        }
      : null;
  const hasConversation = !!listing.existing_conversation_id;
  const isOwner = listing.is_owner ?? false;
  const photoCount = listing.photo_count ?? 0;

  const [isFavorited, setIsFavorited] = useState(listing.is_favorited ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    const prev = isFavorited;
    setIsFavorited(!prev);

    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, {
        method: "POST",
      });
      if (!res.ok) {
        setIsFavorited(prev);
      } else {
        const data = await res.json();
        setIsFavorited(data.favorited);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      setIsFavorited(prev);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const line1 = listing.street || "";
  const line2 = listing.title_standardized || generateTitleStandardized(listing);

  // ── 1-wide: horizontal card ──
  if (cols === 1) {
    return (
      <Link
        href={`/dashboard/listings/${listing.id}/view${viewSearch}`}
        onClick={onBeforeNavigate}
        className={`flex h-[180px] sm:h-[200px] rounded-xl overflow-hidden border transition-shadow hover:shadow-[var(--shadow-elevated)] ${isOwner ? "border-l-4" : ""}`}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
          ...(isOwner ? { borderLeftColor: "var(--orange)" } : {}),
        }}
      >
        {/* Left: photo + status flag */}
        <div className="w-1/3 relative h-full shrink-0 overflow-hidden bg-[var(--bg-elevated)]">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={line1 || "listing"}
              fill
              className="object-cover"
              sizes="33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Building2Icon />
            </div>
          )}
          <StatusFlag status={listing.status} />
        </div>

        {/* Right: details */}
        <div className="w-2/3 p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="min-w-0">
            {/* Title lines — both same color (ADR-005) */}
            <p className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight">
              {line1}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight">
              {line2}
            </p>
            {/* Metadata */}
            <div className="mt-1.5 space-y-0.5">
              {listing.ward && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{listing.ward}</span>
                </div>
              )}
              {(listing.owner_first_name || listing.owner_last_name) && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <User size={11} className="shrink-0" />
                  <span className="truncate">
                    {[listing.owner_first_name, listing.owner_last_name].filter(Boolean).join(" ")}
                  </span>
                </div>
              )}
              {listing.owner_phone && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Phone size={11} className="shrink-0" />
                  <a
                    href={`tel:${listing.owner_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="truncate hover:text-[var(--orange)] transition-colors"
                  >
                    {listing.owner_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Heart — bottom right */}
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute bottom-3 right-3 p-1 rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors focus:outline-none"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>
        </div>
      </Link>
    );
  }

  // ── 2-wide (or 3-wide): vertical card ──
  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-[var(--border)] transition-all duration-200 ${
        isOwner ? "ring-1 ring-[var(--orange)]/40" : ""
      }`}
      style={{
        backgroundColor: "var(--bg-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Link href={`/dashboard/listings/${listing.id}/view${viewSearch}`} onClick={onBeforeNavigate}>
        <div className="relative w-full h-36 bg-[var(--bg-elevated)]">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={line1 || "listing"}
              fill
              className="object-cover"
              sizes="50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Building2Icon />
            </div>
          )}
          {/* Corner flag replaces status badge overlay */}
          <StatusFlag status={listing.status} />
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:text-red-500 hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm shadow-md"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500 border-none" : ""}`}
            />
          </button>
          {isOwner && (
            <div
              className="absolute top-2 right-10 w-2 h-2 rounded-full shadow-[var(--shadow-orange)]"
              style={{ backgroundColor: "var(--orange)" }}
            />
          )}
          {photoCount > 1 && (
            <div
              className="absolute bottom-2 right-2 text-white text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              1/{photoCount}
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        {/* Two-line headline — both same color (ADR-005) */}
        <p className={`font-bold text-[var(--text-primary)] truncate leading-tight ${cols === 3 ? "text-sm" : "text-base"}`}>
          {line1}
        </p>
        <p className={`font-bold text-[var(--text-primary)] truncate leading-tight ${cols === 3 ? "text-sm" : "text-base"}`}>
          {line2}
        </p>

        <div className="flex items-center justify-between mt-3">
          {agent && <AgentChip agent={agent} />}
          <div className="ml-auto">
            {isOwner ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onViewMessages?.(); }}
                className="flex items-center border rounded-md p-1.5 transition-colors hover:bg-[var(--info)]/10"
                style={{ color: "var(--info)", borderColor: "rgba(59, 130, 246, 0.3)" }}
                title={t("viewMessages")}
              >
                <MessageSquare size={14} />
              </button>
            ) : hasConversation ? (
              <Link
                href={`/dashboard/listings/${listing.id}/view${viewSearch}#messages`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center border rounded-md p-1.5 transition-colors hover:bg-[var(--info)]/10"
                style={{ color: "var(--info)", borderColor: "rgba(59, 130, 246, 0.3)" }}
                title={t("viewMessages")}
              >
                <MessageSquare size={14} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onMessage?.(); }}
                className="flex items-center border rounded-md p-1.5 transition-colors hover:bg-[var(--info)]/10"
                style={{ color: "var(--info)", borderColor: "rgba(59, 130, 246, 0.3)" }}
                title={t("message")}
              >
                <MessageSquare size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
