"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Listing } from "@/lib/types";
import { PROPERTY_TYPES, formatPrice } from "@/lib/constants";

// Fix Leaflet default icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const NHA_TRANG_CENTER: [number, number] = [12.2388, 109.1967];

interface Props {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
  height?: string;
}

export default function FeedMap({
  listings,
  onListingClick,
  height = "500px",
}: Props) {
  const mappableListings = listings.filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  // Calculate bounds if we have listings with coordinates
  const bounds =
    mappableListings.length > 0
      ? L.latLngBounds(
          mappableListings.map((l) => [l.latitude!, l.longitude!] as [number, number]),
        )
      : undefined;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={NHA_TRANG_CENTER}
        zoom={13}
        bounds={bounds?.pad(0.1)}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappableListings.map((listing) => {
          const label =
            PROPERTY_TYPES[
              listing.property_type as keyof typeof PROPERTY_TYPES
            ] || listing.property_type;

          return (
            <Marker
              key={listing.id}
              position={[listing.latitude!, listing.longitude!]}
            >
              <Popup>
                <div className="min-w-[200px]">
                  {listing.primary_photo && (
                    <img
                      src={`/api/files/${listing.primary_photo}`}
                      alt=""
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-bold text-sm">
                    {label} - {formatPrice(listing.price_vnd)}
                  </p>
                  {listing.area_m2 && (
                    <p className="text-xs text-gray-600">
                      {listing.area_m2}m²
                      {listing.num_bedrooms
                        ? ` | ${listing.num_bedrooms} bed`
                        : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {[listing.street, listing.ward].filter(Boolean).join(", ")}
                  </p>
                  {onListingClick && (
                    <button
                      onClick={() => onListingClick(listing)}
                      className="mt-2 text-xs text-accent font-medium hover:underline"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {mappableListings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 px-4 py-2 rounded-lg text-sm text-slate-500">
            No listings with coordinates to display
          </div>
        </div>
      )}
    </div>
  );
}
