"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { generateTitleStandardized } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
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

  // Build two-line headline (ADR-005: single source of truth)
  const line1 = listing.address_raw || [listing.street, listing.ward].filter(Boolean).join(", ") || "";
  const line2 = listing.title_standardized || generateTitleStandardized(listing);

  return (
    <Link
      href={`/dashboard/listings/${listing.id}/view?from=listings`}
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
            alt={listing.street ?? "listing"}
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
        <div className="absolute top-2 left-2">
          <StatusBadge status={listing.status} />
        </div>
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

      <div className="p-4">
        {/* Two-line headline */}
        {line1 && (
          <p className="text-xl font-bold text-[var(--text-primary)] truncate leading-tight">{line1}</p>
        )}
        {line2 && (
          <p className="text-xl font-bold text-[var(--text-primary)] truncate leading-tight">{line2}</p>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
          <span>
            {t("updated")}{" "}
            {new Date(listing.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
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
