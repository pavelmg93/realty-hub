"use client";

import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { PriceDisplay } from "./PriceDisplay";
import { AgentChip } from "./AgentChip";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageSquare, Eye, Heart } from "lucide-react";
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
}

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

export function ListingCard({
  listing,
  cols = 2,
  viewSearch = "",
  onMessage,
  onViewMessages,
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
          username: listing.owner_username ?? null,
          phone: listing.owner_phone ?? null,
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
    setIsFavorited(!prev); // Optimistic UI update

    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: prev ? "remove" : "add" }),
      });
      if (!res.ok) {
        setIsFavorited(prev); // Revert on failure
      } else {
        const data = await res.json();
        setIsFavorited(data.favorited);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      setIsFavorited(prev); // Revert on error
    } finally {
      setIsTogglingFavorite(false);
    }
  };

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
      <Link href={`/dashboard/listings/${listing.id}/view${viewSearch}`}>
        <div
          className={`relative w-full bg-[var(--bg-elevated)] ${
            cols === 1 ? "h-48" : "h-36"
          }`}
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={listing.street ?? "listing"}
              fill
              className="object-cover"
              sizes={cols === 1 ? "100vw" : "50vw"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Building2Icon />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StatusBadge
              status={(listing.status as "for_sale") || "for_sale"}
            />
          </div>
          
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
        <PriceDisplay vnd={listing.price_vnd} size="sm" />

        <p className="text-[var(--text-secondary)] text-xs mt-1 truncate">
          {[listing.street, listing.ward, listing.district]
            .filter(Boolean)
            .join(", ")}
        </p>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
          {listing.area_m2 != null && <span>{listing.area_m2}m²</span>}
          {listing.num_bedrooms != null && (
            <span>{listing.num_bedrooms} PN</span>
          )}
          {listing.num_bathrooms != null && (
            <span>{listing.num_bathrooms} WC</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {agent && <AgentChip agent={agent} />}

          <div className="ml-auto">
            {isOwner ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onViewMessages?.();
                }}
                className="flex items-center gap-1 text-[11px] font-medium border rounded-md px-2 py-1 transition-colors hover:bg-[var(--info)]/10"
                style={{
                  color: "var(--info)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                <Eye size={12} /> {t("viewMessages")}
              </button>
            ) : hasConversation ? (
              <Link
                href={`/dashboard/messages/${listing.existing_conversation_id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-medium border rounded-md px-2 py-1 transition-colors hover:bg-[var(--info)]/10"
                style={{
                  color: "var(--info)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                <MessageSquare size={12} /> {t("viewMessages")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onMessage?.();
                }}
                className="flex items-center gap-1 text-[11px] font-medium border rounded-md px-2 py-1 transition-colors hover:bg-[var(--info)]/10"
                style={{
                  color: "var(--info)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                <MessageSquare size={12} /> {t("message")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
