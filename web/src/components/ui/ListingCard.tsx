"use client";

import Image from "next/image";
import Link from "next/link";
import { AgentChip } from "./AgentChip";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateTitleStandardized, formatWardDisplay } from "@/lib/constants";
import { MessageSquare, Heart, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/lib/types";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

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
          dob_year: listing.owner_dob_year ?? null,
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

  const wardDisplay = formatWardDisplay(listing.ward_new, listing.ward);

  // ── 1-wide: horizontal card (larger fonts, maximize space) ──
  if (cols === 1) {
    return (
      <Link
        href={`/dashboard/listings/${listing.id}/view${viewSearch}`}
        onClick={onBeforeNavigate}
        className={`flex rounded-xl overflow-hidden border transition-shadow hover:shadow-[var(--shadow-elevated)] ${isOwner ? "border-l-4" : ""}`}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
          ...(isOwner ? { borderLeftColor: "var(--orange)" } : {}),
        }}
      >
        {/* Left: photo + status flag — 40% width for bigger thumbnail */}
        <div className="w-2/5 relative shrink-0 overflow-hidden bg-[var(--bg-elevated)]" style={{ minHeight: "160px" }}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={line1 || "listing"}
              fill
              className="object-cover"
              sizes="40vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Building2Icon />
            </div>
          )}
          <StatusFlag status={listing.status} />
          {/* Heart — top-right of photo */}
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:text-red-500 hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm shadow-md"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>
          {photoCount > 1 && (
            <div
              className="absolute bottom-2 right-2 text-white text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              1/{photoCount}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="w-3/5 p-3 flex flex-col justify-between overflow-hidden">
          <div className="min-w-0">
            {/* Title lines — larger font for 1-wide (ADR-005) */}
            <p className="text-base font-bold text-[var(--text-primary)] truncate leading-snug">
              {line1}
            </p>
            <p className="text-base font-bold text-[var(--text-primary)] truncate leading-snug">
              {line2}
            </p>
            {/* Ward display */}
            {wardDisplay && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-secondary)]">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{wardDisplay}</span>
              </div>
            )}
          </div>

          {/* Bottom: agent info block */}
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]" onClick={(e) => e.preventDefault()}>
            {agent && (
              <AgentChip agent={agent} size="sm" clickable={!isOwner} />
            )}
            <div className="flex items-center gap-2 mt-1">
              {agent?.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--orange)] transition-colors text-xs leading-none"
                  title={agent.phone}
                >
                  <Phone size={12} />
                  <span>{formatPhone(agent.phone)}</span>
                </a>
              )}
              <div className="ml-auto shrink-0">
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
      </Link>
    );
  }

  // ── 2-wide (or 3-wide): vertical card ──
  return (
    <div
      className={`relative rounded-lg overflow-hidden border transition-all duration-200 ${
        isOwner ? "border-l-4" : "border-[var(--border)]"
      }`}
      style={{
        backgroundColor: "var(--bg-surface)",
        boxShadow: "var(--shadow-card)",
        borderColor: "var(--border)",
        ...(isOwner ? { borderLeftColor: "var(--orange)" } : {}),
      }}
    >
      <Link href={`/dashboard/listings/${listing.id}/view${viewSearch}`} onClick={onBeforeNavigate}>
        {/* Reduced image height: h-28 for 2x2 iPhone fit */}
        <div className="relative w-full h-28 bg-[var(--bg-elevated)]">
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
          <StatusFlag status={listing.status} />
          <button
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:text-red-500 hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm shadow-md"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>
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

      <div className="p-2.5">
        {/* Two-line headline — both same color (ADR-005) */}
        <p className={`font-bold text-[var(--text-primary)] truncate leading-tight ${cols === 3 ? "text-sm" : "text-sm"}`}>
          {line1}
        </p>
        <p className={`font-bold text-[var(--text-primary)] truncate leading-tight ${cols === 3 ? "text-sm" : "text-sm"}`}>
          {line2}
        </p>

        {/* Ward display */}
        {wardDisplay && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-secondary)]">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{wardDisplay}</span>
          </div>
        )}

        {/* Bottom: agent info block */}
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
          {agent && (
            <AgentChip agent={agent} size="sm" clickable={!isOwner} />
          )}
          <div className="flex items-center gap-2 mt-1">
            {agent?.phone && (
              <a
                href={`tel:${agent.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--orange)] transition-colors text-[11px] leading-none"
                title={agent.phone}
              >
                <Phone size={11} />
                <span>{formatPhone(agent.phone)}</span>
              </a>
            )}
            <div className="ml-auto shrink-0">
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
    </div>
  );
}
