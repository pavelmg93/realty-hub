"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  const { t } = useLanguage();

  return (
    <div className="px-4 sm:px-6 max-w-3xl mx-auto py-4">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {t("news")}
      </h1>
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
        <Newspaper size={48} strokeWidth={1.2} className="mb-4 opacity-40" />
        <p className="text-base">{t("comingSoon")}</p>
      </div>
    </div>
  );
}
