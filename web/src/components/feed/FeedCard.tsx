"use client";

import { Listing } from "@/lib/types";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  formatPrice,
  LEGAL_STATUS_TYPES,
  ACCESS_ROAD_TYPES,
  DIRECTION_TYPES,
  FURNISHED_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPES,
} from "@/lib/constants";
import StatusBadge from "@/components/listings/StatusBadge";

interface Props {
  listing: Listing;
  currentUserId: number;
  onMessage: (listing: Listing) => void;
  onClick?: () => void;
}

export default function FeedCard({ listing, currentUserId, onMessage, onClick }: Props) {
  const propertyLabel =
    PROPERTY_TYPES[listing.property_type as keyof typeof PROPERTY_TYPES] ||
    listing.property_type;
  const txLabel =
    TRANSACTION_TYPES[
      listing.transaction_type as keyof typeof TRANSACTION_TYPES
    ] || listing.transaction_type;
  const isOwn = listing.agent_id === currentUserId;

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Photo thumbnail */}
      {listing.primary_photo && (
        <div className="aspect-[16/9] bg-slate-100 relative">
          <img
            src={`/api/files/${listing.primary_photo}`}
            alt=""
            className="w-full h-full object-cover"
          />
          {listing.photo_count && listing.photo_count > 1 && (
            <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 bg-black/60 text-white rounded-full">
              {listing.photo_count} photos
            </span>
          )}
        </div>
      )}

      <div className="p-5">
      {/* Badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={listing.status} />
          {propertyLabel && (
            <span className="text-xs px-2 py-0.5 bg-navy/5 text-navy rounded-full font-medium">
              {propertyLabel}
            </span>
          )}
          {txLabel && (
            <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
              {txLabel}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      {listing.price_vnd && (
        <p className="text-xl font-bold text-navy mb-1">
          {formatPrice(listing.price_vnd)}
        </p>
      )}

      {/* Specs */}
      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
        {listing.area_m2 && <span className="font-medium">{listing.area_m2}m²</span>}
        {listing.num_bedrooms && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
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
        <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Feature tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {listing.legal_status && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {LEGAL_STATUS_TYPES[listing.legal_status as keyof typeof LEGAL_STATUS_TYPES] || listing.legal_status}
          </span>
        )}
        {listing.direction && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {DIRECTION_TYPES[listing.direction as keyof typeof DIRECTION_TYPES] || listing.direction}
          </span>
        )}
        {listing.access_road && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {ACCESS_ROAD_TYPES[listing.access_road as keyof typeof ACCESS_ROAD_TYPES] || listing.access_road}
          </span>
        )}
        {listing.furnished && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {FURNISHED_TYPES[listing.furnished as keyof typeof FURNISHED_TYPES] || listing.furnished}
          </span>
        )}
        {listing.structure_type && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {STRUCTURE_TYPES[listing.structure_type as keyof typeof STRUCTURE_TYPES] || listing.structure_type}
          </span>
        )}
        {listing.building_type && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">
            {BUILDING_TYPES[listing.building_type as keyof typeof BUILDING_TYPES] || listing.building_type}
          </span>
        )}
        {listing.corner_lot && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">Corner</span>
        )}
        {listing.has_elevator && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">Elevator</span>
        )}
        {listing.negotiable && (
          <span className="text-xs px-1.5 py-0.5 bg-navy/5 text-navy/70 rounded">Negotiable</span>
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
          {listing.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        <div className="text-slate-500">
          <span className="font-medium text-slate-700">
            {listing.owner_first_name || listing.owner_username}
          </span>
          {listing.owner_phone && (
            <span className="ml-2 text-slate-400">{listing.owner_phone}</span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isOwn && (
            <>
              {listing.existing_conversation_id ? (
                <a
                  href={`/dashboard/messages/${listing.existing_conversation_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                >
                  Messages
                </a>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onMessage(listing); }}
                  className="px-3 py-1.5 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent/20 font-medium transition-colors"
                >
                  Message
                </button>
              )}
            </>
          )}
          <span className="text-slate-400 py-1">
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
