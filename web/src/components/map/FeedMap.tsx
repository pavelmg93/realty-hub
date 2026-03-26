"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Listing } from "@/lib/types";
import { formatPrice, generateTitleStandardized } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import "./map-popup.css";

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
  const { t } = useLanguage();
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
    <div style={{ height, touchAction: "pan-y" }} className="rounded-lg overflow-hidden border border-[var(--border)]">
      <MapContainer
        center={NHA_TRANG_CENTER}
        zoom={13}
        bounds={bounds?.pad(0.1)}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappableListings.map((listing) => {
          const line1 = listing.street || "";
          const line2 = listing.title_standardized || generateTitleStandardized(listing);

          return (
            <Marker
              key={listing.id}
              position={[listing.latitude!, listing.longitude!]}
            >
              <Popup>
                <div
                  className="w-[220px] cursor-pointer"
                  onClick={() => onListingClick?.(listing)}
                >
                  {listing.primary_photo && (
                    <img
                      src={`/api/files/${listing.primary_photo}`}
                      alt=""
                      className="w-full h-[120px] object-cover"
                    />
                  )}
                  <div className="px-3 py-2">
                    {line1 && (
                      <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>{line1}</p>
                    )}
                    <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>{line2}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {formatPrice(listing.price_vnd)}
                      {listing.area_m2 ? ` · ${listing.area_m2}m²` : ""}
                      {listing.num_bedrooms ? ` · ${listing.num_bedrooms} ${t("bed")}` : ""}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {mappableListings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {t("noListingsWithCoords")}
          </div>
        </div>
      )}
    </div>
  );
}
