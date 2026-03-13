"use client";

import { useLanguage } from "@/contexts/LanguageContext";

function FlagVN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#DA251D" />
      <polygon points="15,4 18.09,14.27 8.19,8.27 21.81,8.27 11.91,14.27" fill="#FFD400" />
    </svg>
  );
}

function FlagEN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="2.5" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="4" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="2.5" />
    </svg>
  );
}

export function LangSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="flex items-stretch flex-shrink-0 rounded-md border border-[var(--border)] overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)" }}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("vi")}
        className={`min-w-[2.5rem] px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none ${
          lang === "vi" ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
        style={lang === "vi" ? { backgroundColor: "var(--orange)" } : undefined}
        title="Tiếng Việt"
        aria-pressed={lang === "vi"}
        aria-label="Vietnamese"
      >
        <FlagVN className="w-4 h-[0.6rem] shrink-0" />
        <span className="whitespace-nowrap">VN</span>
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-w-[2.5rem] px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none ${
          lang === "en" ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
        style={lang === "en" ? { backgroundColor: "var(--orange)" } : undefined}
        title="English"
        aria-pressed={lang === "en"}
        aria-label="English"
      >
        <FlagEN className="w-4 h-[0.6rem] shrink-0" />
        <span className="whitespace-nowrap">EN</span>
      </button>
    </div>
  );
}
