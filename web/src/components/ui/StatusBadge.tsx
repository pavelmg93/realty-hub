"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type Status =
  | "for_sale"
  | "in_negotiations"
  | "pending_closing"
  | "sold"
  | "not_for_sale";

const STATUS_MAP: Record<
  Status,
  { color: string; key: "open" | "negotiating" | "pendingClosing" | "sold" | "notForSale" }
> = {
  for_sale: { color: "var(--status-open)", key: "open" },
  in_negotiations: { color: "var(--status-negotiating)", key: "negotiating" },
  pending_closing: { color: "var(--status-pending)", key: "pendingClosing" },
  sold: { color: "var(--status-sold)", key: "sold" },
  not_for_sale: { color: "var(--status-nfs)", key: "notForSale" },
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: Status | string;
  size?: "sm" | "md";
}) {
  const { t } = useLanguage();
  const cfg = STATUS_MAP[status as Status] ?? STATUS_MAP.for_sale;
  return (
    <span
      style={{ backgroundColor: cfg.color }}
      className={`inline-flex items-center font-semibold text-white rounded-full uppercase tracking-wide ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      {t(cfg.key)}
    </span>
  );
}
