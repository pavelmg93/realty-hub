"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

type Status =
  | "just_listed"
  | "selling"
  | "price_dropped"
  | "price_increased"
  | "deposit"
  | "sold"
  | "not_for_sale";

const STATUS_MAP: Record<
  Status,
  { color: string; key: TranslationKey }
> = {
  just_listed: { color: "var(--info)", key: "justListed" },
  selling: { color: "var(--status-open)", key: "selling" },
  price_dropped: { color: "var(--error)", key: "priceDropped" },
  price_increased: { color: "var(--error)", key: "priceIncreased" },
  deposit: { color: "var(--status-open)", key: "deposit" },
  sold: { color: "var(--status-open)", key: "sold" },
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
  // Don't show badge for "selling" (default status)
  if (status === "selling") return null;
  const cfg = STATUS_MAP[status as Status];
  if (!cfg) return null;
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
