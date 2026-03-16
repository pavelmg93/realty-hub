"use client";

import { Listing } from "@/lib/types";
import { formatPrice, formatPriceShortest } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTypeKey, getTransactionTypeKey, getFieldValueLabel } from "@/lib/i18n";

function buildSpecsLine(l: Listing): string {
  const parts: string[] = [];
  if (l.area_m2) parts.push(`${l.area_m2}m²`);
  if (l.num_floors) parts.push(`${l.num_floors}T`);
  if (l.frontage_m && l.depth_m) parts.push(`${l.frontage_m}x${l.depth_m}`);
  if (l.commission) parts.push(l.commission);
  if (l.price_vnd) parts.push(formatPriceShortest(l.price_vnd));
  return parts.join(" ");
}

interface Props {
  listing: Listing;
  currentUserId: number;
  onMessage: (listing: Listing) => void;
  onClick?: () => void;
}

export default function FeedCard({ listing, currentUserId, onMessage, onClick }: Props) {
  const { t, lang } = useLanguage();
  const propertyKey = getPropertyTypeKey(listing.property_type ?? undefined);
  const txKey = getTransactionTypeKey(listing.transaction_type ?? undefined);
  const propertyLabel = propertyKey ? t(propertyKey) : (listing.property_type ?? "");
  const txLabel = txKey ? t(txKey) : (listing.transaction_type ?? "");
  const isOwn = listing.agent_id === currentUserId;

  return (
    <div
      className="border rounded-xl overflow-hidden transition-shadow cursor-pointer hover:shadow-[var(--shadow-elevated)]"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
      onClick={onClick}
    >
      {/* Photo thumbnail */}
      {listing.primary_photo ? (
        <div className="aspect-[16/9] relative" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <img
            src={`/api/files/${listing.primary_photo}`}
            alt=""
            className="w-full h-full object-cover"
          />
          {listing.photo_count && listing.photo_count > 0 && (
            <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 bg-black/60 text-white rounded-full">
              {listing.photo_count} {listing.photo_count === 1 ? "photo" : "photos"}
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-[16/9] flex items-center justify-center text-sm text-[var(--text-muted)]" style={{ backgroundColor: "var(--bg-elevated)" }}>
          {t("noPhoto")}
        </div>
      )}

      <div className="p-5">
      {/* Badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={listing.status} />
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
      </div>

      {/* Two-line headline */}
      <p className="text-xl font-bold text-[var(--text-primary)] truncate leading-tight">
        {listing.address_raw || [listing.street, listing.ward].filter(Boolean).join(", ") || ""}
      </p>
      <p className="text-xl font-bold text-[var(--text-primary)] truncate leading-tight mb-2">
        {listing.title_standardized || buildSpecsLine(listing)}
      </p>

      {/* Feature tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {listing.legal_status && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("legal_status", listing.legal_status, lang)}
          </span>
        )}
        {listing.direction && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("direction", listing.direction, lang)}
          </span>
        )}
        {listing.access_road && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("access_road", listing.access_road, lang)}
          </span>
        )}
        {listing.furnished && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("furnished", listing.furnished, lang)}
          </span>
        )}
        {listing.structure_type && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("structure_type", listing.structure_type, lang)}
          </span>
        )}
        {listing.building_type && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {getFieldValueLabel("building_type", listing.building_type, lang)}
          </span>
        )}
        {listing.corner_lot && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>{t("cornerLot")}</span>
        )}
        {listing.has_elevator && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>{t("elevator")}</span>
        )}
        {listing.negotiable && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>{t("negotiable")}</span>
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">
          {listing.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border)]">
        <div className="text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-primary)]">
            {listing.owner_first_name || listing.owner_username}
          </span>
          {listing.owner_phone && (
            <span className="ml-2 text-[var(--text-muted)]">{listing.owner_phone}</span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isOwn && (
            <>
              {listing.existing_conversation_id ? (
                <a
                  href={`/dashboard/messages/${listing.existing_conversation_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors border border-[var(--info)] text-[var(--info)] hover:bg-[var(--info)]/10"
                >
                  Messages
                </a>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onMessage(listing); }}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors text-[var(--orange)]"
                  style={{ backgroundColor: "rgba(232,119,34,0.15)" }}
                >
                  Message
                </button>
              )}
            </>
          )}
          <span className="text-[var(--text-muted)] py-1">
            {new Date(listing.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
