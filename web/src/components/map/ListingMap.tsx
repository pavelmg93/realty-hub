"use client";

import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in bundlers
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

// Nha Trang center
const NHA_TRANG_CENTER: [number, number] = [12.2388, 109.1967];
const DEFAULT_ZOOM = 14;

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  interactive?: boolean;
  popupContent?: string;
}

function ClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}

export default function ListingMap({
  latitude,
  longitude,
  onLocationChange,
  height = "300px",
  interactive = false,
  popupContent,
}: Props) {
  const hasCoords = latitude != null && longitude != null;
  const center: [number, number] = hasCoords
    ? [latitude, longitude]
    : NHA_TRANG_CENTER;
  const zoom = hasCoords ? 16 : DEFAULT_ZOOM;

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    hasCoords ? [latitude, longitude] : null,
  );

  // Sync marker when props change (e.g., Google Maps URL paste)
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setMarkerPos([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleClick = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      onLocationChange?.(lat, lng);
    },
    [onLocationChange],
  );

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-[var(--border)]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        {interactive && <ClickHandler onLocationChange={handleClick} />}
        {markerPos && (
          <Marker position={markerPos}>
            {popupContent && <Popup>{popupContent}</Popup>}
          </Marker>
        )}
        {!interactive && hasCoords && !markerPos && (
          <Marker position={center}>
            {popupContent && <Popup>{popupContent}</Popup>}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
