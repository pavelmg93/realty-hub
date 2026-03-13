"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[var(--border)] p-3 flex gap-2"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("typeMessage")}
        rows={1}
        disabled={disabled}
        className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--orange)] text-[var(--text-primary)] bg-[var(--bg-input)] placeholder:text-[var(--text-muted)]"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending || disabled}
        className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        style={{ backgroundColor: "var(--orange)" }}
      >
        {t("send")}
      </button>
    </form>
  );
}
