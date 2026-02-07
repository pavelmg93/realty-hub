"use client";

import { Listing } from "@/lib/types";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  formatPrice,
  LEGAL_STATUS_TYPES,
  ACCESS_ROAD_TYPES,
  DIRECTION_TYPES,
} from "@/lib/constants";
import StatusBadge from "@/components/listings/StatusBadge";

interface Props {
  listing: Listing;
  currentUserId: number;
  onMessage: (listing: Listing) => void;
}

export default function FeedCard({ listing, currentUserId, onMessage }: Props) {
  const propertyLabel =
    PROPERTY_TYPES[listing.property_type as keyof typeof PROPERTY_TYPES] ||
    listing.property_type;
  const txLabel =
    TRANSACTION_TYPES[
      listing.transaction_type as keyof typeof TRANSACTION_TYPES
    ] || listing.transaction_type;
  const isOwn = listing.agent_id === currentUserId;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={listing.status} />
          {propertyLabel && (
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              {propertyLabel}
            </span>
          )}
          {txLabel && (
            <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
              {txLabel}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        {listing.price_vnd && (
          <p className="text-lg font-semibold">
            {formatPrice(listing.price_vnd)}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
          {listing.area_m2 && <span>{listing.area_m2}m²</span>}
          {listing.num_bedrooms && <span>{listing.num_bedrooms} bed</span>}
          {listing.num_bathrooms && <span>{listing.num_bathrooms} bath</span>}
          {listing.num_floors && <span>{listing.num_floors} floor</span>}
          {listing.frontage_m && <span>{listing.frontage_m}m front</span>}
        </div>
      </div>

      {(listing.ward || listing.street) && (
        <p className="text-sm text-gray-500 mb-2">
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {listing.legal_status && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            {LEGAL_STATUS_TYPES[
              listing.legal_status as keyof typeof LEGAL_STATUS_TYPES
            ] || listing.legal_status}
          </span>
        )}
        {listing.direction && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            {DIRECTION_TYPES[
              listing.direction as keyof typeof DIRECTION_TYPES
            ] || listing.direction}
          </span>
        )}
        {listing.access_road && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            {ACCESS_ROAD_TYPES[
              listing.access_road as keyof typeof ACCESS_ROAD_TYPES
            ] || listing.access_road}
          </span>
        )}
        {listing.corner_lot && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            Corner
          </span>
        )}
        {listing.has_elevator && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            Elevator
          </span>
        )}
        {listing.negotiable && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            Negotiable
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t">
        <div className="text-gray-500">
          <span className="font-medium">
            {listing.owner_first_name || listing.owner_username}
          </span>
          {listing.owner_phone && (
            <span className="ml-2 text-gray-400">{listing.owner_phone}</span>
          )}
        </div>
        <div className="flex gap-2">
          {!isOwn && (
            <>
              {listing.existing_conversation_id ? (
                <a
                  href={`/dashboard/messages/${listing.existing_conversation_id}`}
                  className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                >
                  Messages
                </a>
              ) : (
                <button
                  onClick={() => onMessage(listing)}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Message
                </button>
              )}
            </>
          )}
          <span className="text-gray-400 py-1">
            {new Date(listing.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
