"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Message, Conversation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/constants";
import MessageThread from "@/components/messages/MessageThread";
import MessageInput from "@/components/messages/MessageInput";

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        { credentials: "include" },
      );
      if (!res.ok) {
        if (res.status === 404) setError(t("conversationNotFound"));
        else if (res.status === 403)
          setError(t("noAccessConversation"));
        else setError(t("failedLoadMessages"));
        return;
      }
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      setError(t("failedLoadMessages"));
    } finally {
      setLoading(false);
    }
  }, [conversationId, t]);

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) setConversation(data.conversation);
      } else {
        setError(t("conversationNotFound"));
      }
    } catch {
      setError(t("failedLoadMessages"));
    }
  }, [conversationId, t]);

  useEffect(() => {
    fetchMessages();
    fetchConversation();
  }, [fetchMessages, fetchConversation]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async (body: string) => {
    const res = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, listing_id: conversation?.listing_id }),
      },
    );
    if (res.ok) {
      await fetchMessages();
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--error)] mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {t("backToMessages")}
        </button>
      </div>
    );
  }

  if (loading || !conversation) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">{t("loadingMessages")}</div>
    );
  }

  const otherName =
    conversation.other_agent_first_name ||
    conversation.other_agent_name ||
    conversation.other_agent_username ||
    t("agent");
  const otherAvatar = conversation.other_agent_avatar_url;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-56px-64px)]">
      {/* Bar 1: Agent info — entire bar clickable → agent profile */}
      <Link
        href={conversation.other_agent_id ? `/dashboard/agents/${conversation.other_agent_id}` : "#"}
        className="flex-none flex items-center gap-3 py-3 px-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        {otherAvatar ? (
          <img
            src={`/api/files/${otherAvatar}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: "var(--border)" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-semibold text-white text-sm"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {otherName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[var(--text-primary)] text-sm">{otherName}</span>
          {conversation.other_agent_email && (
            <span className="text-xs text-[var(--text-muted)]">{conversation.other_agent_email}</span>
          )}
          {conversation.other_agent_phone && (
            <span className="text-xs text-[var(--text-muted)]">{conversation.other_agent_phone}</span>
          )}
        </div>
      </Link>

      {/* Bar 2: Property info — clickable → listing detail */}
      {conversation?.listing_id != null && (
        <Link
          href={`/dashboard/listings/${conversation.listing_id}/view?from=messages`}
          className="flex-none flex gap-3 items-center px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {conversation.listing_primary_photo ? (
            <img
              src={`/api/files/${conversation.listing_primary_photo}`}
              alt=""
              className="w-14 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div
              className="w-14 h-10 rounded-lg shrink-0 flex items-center justify-center text-[var(--text-muted)] text-xs"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              —
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Two-line title per ADR-005: line 1 = street, line 2 = title_standardized */}
            {conversation.listing_street ? (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {conversation.listing_street}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {conversation.listing_title_standardized || `#${conversation.listing_id}`}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {conversation.listing_title_standardized ||
                  conversation.listing_address_raw ||
                  conversation.listing_ward ||
                  `#${conversation.listing_id}`}
              </p>
            )}
            <p className="text-xs text-[var(--text-muted)] truncate">
              {[
                conversation.listing_area_m2 ? `${conversation.listing_area_m2}m²` : null,
                conversation.listing_price_vnd != null ? formatPrice(conversation.listing_price_vnd) : null,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </Link>
      )}

      {/* Scrollable messages area */}
      <div className="flex-1 min-h-0 h-full">
        <MessageThread messages={messages} currentUserId={user?.id ?? 0} />
      </div>

      {/* Fixed input */}
      <div className="flex-none">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
