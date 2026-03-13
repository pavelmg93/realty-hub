"use client";

import { LISTING_STATUSES } from "@/lib/constants";

export default function StatusBadge({ status }: { status: string }) {
  const info = LISTING_STATUSES[status as keyof typeof LISTING_STATUSES];
  if (!info) return <span className="text-xs text-[var(--text-muted)]">{status}</span>;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${info.color}`}>
      {info.label}
    </span>
  );
}
