"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-lg flex items-center justify-center border border-[var(--border)]"
      style={{ height: "300px", backgroundColor: "var(--bg-elevated)" }}
    >
      <span className="text-sm text-[var(--text-muted)]">Loading map...</span>
    </div>
  ),
});

export default ListingMap;
