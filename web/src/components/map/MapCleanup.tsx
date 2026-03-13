"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Cleans up the Leaflet map instance on unmount to avoid React removeChild errors
 * when the map DOM is mutated by Leaflet. Must be rendered inside MapContainer.
 */
export function MapCleanup() {
  const map = useMap();

  useEffect(() => {
    return () => {
      try {
        if (map) map.remove();
      } catch {
        // ignore cleanup errors
      }
    };
  }, [map]);

  return null;
}
