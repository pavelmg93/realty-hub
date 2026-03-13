"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

interface TranslateButtonProps {
  text: string;
  onTranslated: (result: string) => void;
}

export function TranslateButton({
  text,
  onTranslated,
}: TranslateButtonProps) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const target = lang === "en" ? "vi" : "en";
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target }),
      });
      if (res.ok) {
        const { translated } = await res.json();
        onTranslated(translated);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs border rounded px-2.5 py-1.5 transition-colors disabled:opacity-50"
      style={{
        color: "var(--text-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <Globe size={13} />
      {loading
        ? "Translating..."
        : lang === "en"
          ? t("translateToVi")
          : t("translateToEn")}
    </button>
  );
}
