"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { PROPERTY_TYPES, TRANSACTION_TYPES, formatPrice } from "@/lib/constants";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

interface Props {
  listing: Listing;
  isArchived?: boolean;
  onArchive?: (id: number) => void;
  onReactivate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ListingCard({
  listing,
  isArchived,
  onArchive,
  onReactivate,
  onDelete,
}: Props) {
  const propertyLabel =
    PROPERTY_TYPES[listing.property_type as keyof typeof PROPERTY_TYPES] ||
    listing.property_type;
  const txLabel =
    TRANSACTION_TYPES[
      listing.transaction_type as keyof typeof TRANSACTION_TYPES
    ] || listing.transaction_type;

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
          <p className="text-lg font-semibold">{formatPrice(listing.price_vnd)}</p>
        )}
        <div className="flex gap-3 text-sm text-gray-600 mt-1">
          {listing.area_m2 && <span>{listing.area_m2}m²</span>}
          {listing.num_bedrooms && <span>{listing.num_bedrooms} bed</span>}
          {listing.num_bathrooms && <span>{listing.num_bathrooms} bath</span>}
          {listing.num_floors && <span>{listing.num_floors} floor</span>}
        </div>
      </div>

      {(listing.ward || listing.street) && (
        <p className="text-sm text-gray-500 mb-3">
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
        <span>
          Updated{" "}
          {new Date(listing.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <div className="flex gap-2">
          {!isArchived ? (
            <>
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                Edit
              </Link>
              {onArchive && (
                <ConfirmButton
                  label="Archive"
                  confirmLabel="Confirm"
                  onConfirm={() => onArchive(listing.id)}
                  className="text-orange-600 hover:bg-orange-50"
                />
              )}
            </>
          ) : (
            <>
              {onReactivate && (
                <ConfirmButton
                  label="Re-activate"
                  confirmLabel="Confirm"
                  onConfirm={() => onReactivate(listing.id)}
                  className="text-green-600 hover:bg-green-50"
                />
              )}
              {onDelete && (
                <ConfirmButton
                  label="Delete"
                  confirmLabel="Confirm"
                  onConfirm={() => onDelete(listing.id)}
                  className="text-red-600 hover:bg-red-50"
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
  const [confirming, setConfirming] = useState(false);

  return confirming ? (
    <div className="flex gap-1">
      <button
        onClick={() => { onConfirm(); setConfirming(false); }}
        className={`px-2 py-1 text-xs rounded ${className}`}
      >
        {confirmLabel}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      onClick={() => setConfirming(true)}
      className={`px-2 py-1 text-xs rounded ${className}`}
    >
      {label}
    </button>
  );
}
