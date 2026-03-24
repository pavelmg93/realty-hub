"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { generateTitleStandardized } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, MapPin, User, Phone } from "lucide-react";

// Corner flag colors (spec REA-69/73):
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

interface Props {
  listing: Listing;
  isArchived?: boolean;
  isOwner?: boolean;
  cols?: 1 | 2;
  onReactivate?: (id: number) => void;
  onDelete?: (id: number) => void;
  /** Called before navigating to listing detail (e.g. to save scroll position) */
  onBeforeNavigate?: () => void;
}

export default function ListingCard({
  listing,
  isArchived,
  isOwner,
  cols = 2,
  onReactivate,
  onDelete,
  onBeforeNavigate,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();

  const [isFavorited, setIsFavorited] = useState(listing.is_favorited ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const photoUrl = listing.primary_photo
    ? `/api/files/${listing.primary_photo}`
    : null;
  const photoCount = listing.photo_count ?? 0;

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

  // Build two-line headline (ADR-005)
  const line1 = listing.street || "";
  const line2 = listing.title_standardized || generateTitleStandardized(listing);
  const agentName = [listing.owner_first_name, listing.owner_last_name].filter(Boolean).join(" ");

  // ── 1-wide: horizontal card ──
  if (cols === 1) {
    return (
      <Link
        href={`/dashboard/listings/${listing.id}/view?from=listings`}
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
              </svg>
            </div>
          )}
          <StatusFlag status={listing.status} />
        </div>

        {/* Right: details */}
        <div className="w-2/3 p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="min-w-0">
            {/* Title lines — both same color (ADR-005) */}
            <p className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">{line1}</p>
            <p className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">{line2}</p>
            <div className="mt-1.5 space-y-0.5">
              {listing.ward && (
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{listing.ward}</span>
                </div>
              )}
              {agentName && (
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <User size={12} className="shrink-0" />
                  <span className="truncate">{agentName}</span>
                </div>
              )}
              {listing.owner_phone && (
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Phone size={12} className="shrink-0" />
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

          {/* Actions row */}
          <div className="flex items-center justify-between" onClick={(e) => e.preventDefault()}>
            <div className="flex gap-2 flex-wrap">
              {!isArchived ? (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/listings/${listing.id}/edit`); }}
                  className="px-2 py-0.5 text-[11px] border rounded font-medium border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10"
                >
                  {t("edit")}
                </button>
              ) : (
                <>
                  {onReactivate && (
                    <ConfirmButton label={t("reactivate")} confirmLabel={t("confirm")} onConfirm={() => onReactivate(listing.id)} className="text-[11px] text-emerald-500" />
                  )}
                  {onDelete && (
                    <ConfirmButton label={t("delete")} confirmLabel={t("confirm")} onConfirm={() => onDelete(listing.id)} className="text-[11px] text-rose-500" />
                  )}
                </>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors focus:outline-none"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={16} className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // ── 2-wide: vertical card ──
  return (
    <Link
      href={`/dashboard/listings/${listing.id}/view?from=listings`}
      onClick={onBeforeNavigate}
      className={`block rounded-xl overflow-hidden border transition-shadow hover:shadow-[var(--shadow-elevated)] ${isOwner ? "border-l-4" : ""}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border)",
        ...(isOwner ? { borderLeftColor: "var(--orange)" } : {}),
      }}
    >
      {/* Photo area */}
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
            </svg>
          </div>
        )}
        {/* Corner flag replaces old status badge overlay */}
        <StatusFlag status={listing.status} />
        <button
          onClick={toggleFavorite}
          disabled={isTogglingFavorite}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:text-red-500 hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm shadow-md"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={16} className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
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

      <div className="p-4">
        {/* Title lines — both same color (ADR-005) */}
        {line1 && <p className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">{line1}</p>}
        {line2 && <p className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">{line2}</p>}

        {agentName && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--text-secondary)]">
            <User size={11} className="shrink-0" />
            <span className="truncate">{agentName}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-3 mt-2 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
          <span>
            {t("updated")}{" "}
            {new Date(listing.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <div className="flex gap-2 flex-wrap" onClick={(e) => e.preventDefault()}>
            {!isArchived ? (
              <>
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/dashboard/messages"); }}
                    className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10"
                  >
                    {t("inquiries")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/listings/${listing.id}/edit`); }}
                  className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10"
                >
                  {t("edit")}
                </button>
              </>
            ) : (
              <>
                {onReactivate && (
                  <ConfirmButton label={t("reactivate")} confirmLabel={t("confirm")} onConfirm={() => onReactivate(listing.id)} className="text-emerald-600 hover:bg-emerald-50" />
                )}
                {onDelete && (
                  <ConfirmButton label={t("delete")} confirmLabel={t("confirm")} onConfirm={() => onDelete(listing.id)} className="text-rose-600 hover:bg-rose-50" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return confirming ? (
    <div className="flex gap-1" onClick={handleClick}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirm(); setConfirming(false); }}
        className={`px-2 py-1 text-xs rounded ${className}`}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
        className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        {t("cancel")}
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
      className={`px-2 py-1 text-xs rounded ${className}`}
    >
      {label}
    </button>
  );
}
