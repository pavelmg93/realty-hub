import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize, Heart, Calendar } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  "Open": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "In Negotiations": "bg-amber-100 text-amber-700 border-amber-200",
  "Closing": "bg-blue-100 text-blue-700 border-blue-200",
  "Sold": "bg-gray-100 text-gray-500 border-gray-200",
  "Not For Sale": "bg-red-100 text-red-700 border-red-200",
};

const TYPE_LABELS = {
  apartment: "Apartment",
  house: "House",
  villa: "Villa",
  townhouse: "Townhouse",
  land: "Land",
  commercial: "Commercial",
  shophouse: "Shophouse",
  penthouse: "Penthouse",
};

export default function ListingCard({ listing, isFavorited, onToggleFavorite, showAgent = true }) {
  const mainPhoto = listing.photos?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80";

  const formatPrice = (price) => {
    if (!price) return "Contact";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainPhoto}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${STATUS_COLORS[listing.transaction_status] || STATUS_COLORS["Open"]} border text-[11px] font-semibold`}>
            {listing.transaction_status || "Open"}
          </Badge>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 right-12">
          <Badge className="bg-white/90 text-gray-700 border-0 text-[11px] backdrop-blur-sm">
            {TYPE_LABELS[listing.property_type] || listing.property_type}
          </Badge>
        </div>

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(listing.id); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
          </button>
        )}

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-xl drop-shadow-lg">{formatPrice(listing.price)}</p>
          {listing.price_vnd && (
            <p className="text-white/80 text-xs">{listing.price_vnd} tỷ VND</p>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1.5 group-hover:text-teal-600 transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{listing.address || listing.district}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            {listing.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" /> {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" /> {listing.bathrooms}
              </span>
            )}
            {listing.area_sqm > 0 && (
              <span className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5" /> {listing.area_sqm} m²
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {showAgent && listing.agent_name && (
              <span className="text-[11px] text-gray-400 truncate">{listing.agent_name}</span>
            )}
            <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              {listing.created_date ? format(new Date(listing.created_date), "MMM d") : ""}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}