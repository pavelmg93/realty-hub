"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTypeKey, getTransactionTypeKey } from "@/lib/i18n";
import { Heart } from "lucide-react";

interface Props {
  listing: Listing;
  isArchived?: boolean;
  /** When true, show corp. orange highlight (e.g. on My Listings) */
  isOwner?: boolean;
  onArchive?: (id: number) => void;
  onReactivate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ListingCard({
  listing,
  isArchived,
  isOwner,
  onArchive,
  onReactivate,
  onDelete,
}: Props) {
  const { t } = useLanguage();
  const propertyKey = getPropertyTypeKey(listing.property_type ?? undefined);
  const txKey = getTransactionTypeKey(listing.transaction_type ?? undefined);
  const propertyLabel = propertyKey ? t(propertyKey) : (listing.property_type ?? "");
  const txLabel = txKey ? t(txKey) : (listing.transaction_type ?? "");

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
      className={`rounded-xl p-5 border transition-shadow hover:shadow-[var(--shadow-elevated)] ${isOwner ? "border-l-4" : ""}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border)",
        ...(isOwner ? { borderLeftColor: "var(--orange)" } : {}),
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={listing.status as "for_sale"} />
          {propertyLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(232,119,34,0.15)", color: "var(--orange)" }}>
              {propertyLabel}
            </span>
          )}
          {txLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(232,119,34,0.15)", color: "var(--orange)" }}>
              {txLabel}
            </span>
          )}
        </div>
        
        <button
          onClick={toggleFavorite}
          disabled={isTogglingFavorite}
          className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
          />
        </button>
      </div>

      <div className="mb-2">
        {listing.price_vnd && (
          <p className="text-xl font-bold text-[var(--text-primary)]">{formatPrice(listing.price_vnd)}</p>
        )}
        <div className="flex gap-3 text-sm mt-1 text-[var(--text-secondary)]">
          {listing.area_m2 && <span className="font-medium">{listing.area_m2}m²</span>}
          {listing.num_bedrooms != null && <span>{listing.num_bedrooms} {t("bed")}</span>}
          {listing.num_bathrooms != null && <span>{listing.num_bathrooms} {t("bath")}</span>}
          {listing.num_floors != null && <span>{listing.num_floors} {t("floor")}</span>}
        </div>
      </div>

      {(listing.ward || listing.street) && (
        <p className="text-sm mb-3 flex items-center gap-1 text-[var(--text-muted)]">
          <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
        <span>
          {t("updated")}{" "}
          {new Date(listing.updated_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <div className="flex gap-2 flex-wrap">
          {!isArchived ? (
            <>
              <Link
                href={`/dashboard/listings/${listing.id}/view?from=listings`}
                className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                {t("view")}
              </Link>
              {isOwner && (
                <Link
                  href="/dashboard/messages"
                  className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10"
                >
                  {t("inquiries")}
                </Link>
              )}
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10"
              >
                {t("edit")}
              </Link>
              {onArchive && (
                <ConfirmButton
                  label={t("archive")}
                  confirmLabel={t("confirm")}
                  onConfirm={() => onArchive(listing.id)}
                  className="text-orange-600 hover:bg-orange-50"
                />
              )}
            </>
          ) : (
            <>
              {onReactivate && (
                <ConfirmButton
                  label={t("reactivate")}
                  confirmLabel={t("confirm")}
                  onConfirm={() => onReactivate(listing.id)}
                  className="text-emerald-600 hover:bg-emerald-50"
                />
              )}
              {onDelete && (
                <ConfirmButton
                  label={t("delete")}
                  confirmLabel={t("confirm")}
                  onConfirm={() => onDelete(listing.id)}
                  className="text-rose-600 hover:bg-rose-50"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);

  return confirming ? (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => { onConfirm(); setConfirming(false); }}
        className={`px-2 py-1 text-xs rounded ${className}`}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        {t("cancel")}
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`px-2 py-1 text-xs rounded ${className}`}
    >
      {label}
    </button>
  );
}
