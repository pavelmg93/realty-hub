"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NewMessagePage() {
  return (
    <Suspense>
      <NewMessagePageInner />
    </Suspense>
  );
}

function NewMessagePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const listingId = searchParams.get("listing_id");
  const agentId = searchParams.get("agent_id");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listingIdNum = listingId ? parseInt(listingId, 10) : null;
  const agentIdNum = agentId ? parseInt(agentId, 10) : null;
  const validAgent = agentIdNum != null && !Number.isNaN(agentIdNum);
  const canSend = body.trim().length > 0 && validAgent && !sending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const createRes = await fetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          other_agent_id: agentIdNum,
          ...(listingIdNum != null && !Number.isNaN(listingIdNum) ? { listing_id: listingIdNum } : {}),
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        setError(data.error || "Failed to start conversation");
        setSending(false);
        return;
      }
      const { conversation } = await createRes.json();
      const messageRes = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), listing_id: listingIdNum ?? null }),
      });
      if (!messageRes.ok) {
        setError(t("conversationCreatedSendFailed"));
        setSending(false);
        return;
      }
      router.push(`/dashboard/messages/${conversation.id}`);
    } catch {
      setError(t("somethingWentWrong"));
      setSending(false);
    }
  };

  if (!validAgent) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <p className="text-[var(--text-muted)] mb-4">{t("chooseAgentHint")}</p>
        <Link href="/dashboard/messages" className="text-[var(--info)] hover:underline">{t("backToMessages")}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{t("newMessage")}</h1>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        {listingIdNum != null ? `${t("newMessageAboutListing")} #${listingIdNum}. ` : `${t("startGeneralConversation")} `}
        {t("threadCreatedWhenSend")}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("typeMessage")}
          rows={4}
          className="w-full rounded-xl px-3 py-2 text-sm resize-y"
          disabled={sending}
        />
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSend || sending}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {sending ? t("sending") : t("sendMessage")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)]"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
