"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { MessagesList } from "@/components/messages/MessagesList";

export default function MessagesPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t("messages")}</h1>
      <MessagesList />
    </div>
  );
}
