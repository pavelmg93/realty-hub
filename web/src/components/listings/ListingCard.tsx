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
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
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

      <div className="mb-2">
        {listing.price_vnd && (
          <p className="text-xl font-bold text-navy">{formatPrice(listing.price_vnd)}</p>
        )}
        <div className="flex gap-3 text-sm text-slate-600 mt-1">
          {listing.area_m2 && <span className="font-medium">{listing.area_m2}m²</span>}
          {listing.num_bedrooms && <span>{listing.num_bedrooms} bed</span>}
          {listing.num_bathrooms && <span>{listing.num_bathrooms} bath</span>}
          {listing.num_floors && <span>{listing.num_floors} floor</span>}
        </div>
      </div>

      {(listing.ward || listing.street) && (
        <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {[listing.street, listing.ward].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
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
                href={`/dashboard/listings/${listing.id}/view`}
                className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                View
              </Link>
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="px-3 py-1.5 text-xs border border-navy/20 text-navy rounded-lg hover:bg-navy/5 font-medium transition-colors"
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
                  className="text-emerald-600 hover:bg-emerald-50"
                />
              )}
              {onDelete && (
                <ConfirmButton
                  label="Delete"
                  confirmLabel="Confirm"
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
        className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
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
