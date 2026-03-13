"use client";

import { Listing } from "@/lib/types";
import {
  formatPrice,
  LEGAL_STATUS_TYPES,
  ACCESS_ROAD_TYPES,
  DIRECTION_TYPES,
  FURNISHED_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPES,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTypeKey, getTransactionTypeKey } from "@/lib/i18n";

interface Props {
  listing: Listing;
  currentUserId: number;
  onMessage: (listing: Listing) => void;
  onClick?: () => void;
}

export default function FeedCard({ listing, currentUserId, onMessage, onClick }: Props) {
  const { t } = useLanguage();
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

      {/* Price */}
      {listing.price_vnd && (
        <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
          {formatPrice(listing.price_vnd)}
        </p>
      )}

      {/* Specs */}
      <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)] mb-3">
        {listing.area_m2 && <span className="font-medium">{listing.area_m2}m²</span>}
        {listing.num_bedrooms && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            {listing.num_bedrooms} bed
          </span>
        )}
        {listing.num_bathrooms && <span>{listing.num_bathrooms} bath</span>}
        {listing.num_floors && <span>{listing.num_floors} floor</span>}
        {listing.frontage_m && <span>{listing.frontage_m}m front</span>}
        {listing.depth_m && <span>{listing.depth_m}m deep</span>}
      </div>

      {/* Location */}
      {(listing.ward || listing.street) && (
        <p className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Feature tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {listing.legal_status && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {LEGAL_STATUS_TYPES[listing.legal_status as keyof typeof LEGAL_STATUS_TYPES] || listing.legal_status}
          </span>
        )}
        {listing.direction && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {DIRECTION_TYPES[listing.direction as keyof typeof DIRECTION_TYPES] || listing.direction}
          </span>
        )}
        {listing.access_road && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {ACCESS_ROAD_TYPES[listing.access_road as keyof typeof ACCESS_ROAD_TYPES] || listing.access_road}
          </span>
        )}
        {listing.furnished && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {FURNISHED_TYPES[listing.furnished as keyof typeof FURNISHED_TYPES] || listing.furnished}
          </span>
        )}
        {listing.structure_type && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {STRUCTURE_TYPES[listing.structure_type as keyof typeof STRUCTURE_TYPES] || listing.structure_type}
          </span>
        )}
        {listing.building_type && (
          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-hover)" }}>
            {BUILDING_TYPES[listing.building_type as keyof typeof BUILDING_TYPES] || listing.building_type}
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
