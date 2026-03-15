"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type Status =
  | "just_listed"
  | "for_sale"
  | "price_dropped"
  | "price_increased"
  | "deposit"
  | "sold"
  | "not_for_sale";

const STATUS_MAP: Record<
  Status,
  { color: string; key: "justListed" | "forSale" | "priceDropped" | "priceIncreased" | "deposit" | "sold" | "notForSale" }
> = {
  just_listed: { color: "var(--info)", key: "justListed" },
  for_sale: { color: "var(--status-open)", key: "forSale" },
  price_dropped: { color: "var(--status-open)", key: "priceDropped" },
  price_increased: { color: "var(--status-open)", key: "priceIncreased" },
  deposit: { color: "var(--status-pending)", key: "deposit" },
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
