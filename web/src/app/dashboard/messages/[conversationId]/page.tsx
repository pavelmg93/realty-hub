"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Message, Conversation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { PROPERTY_TYPES, formatPrice } from "@/lib/constants";
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

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (res.ok) router.push("/dashboard/messages");
    } catch {
      // ignore
    }
  };

  const handleUnarchive = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (res.ok) {
        setConversation((c) => (c ? { ...c, archived_at: null } : null));
      }
    } catch {
      // ignore
    }
  };

  const listingSubtitle =
    conversation?.listing_id != null
      ? [
          conversation?.listing_property_type
            ? PROPERTY_TYPES[
                conversation.listing_property_type as keyof typeof PROPERTY_TYPES
              ] || conversation.listing_property_type
            : null,
          conversation?.listing_ward,
          conversation?.listing_price_vnd
            ? formatPrice(conversation.listing_price_vnd)
            : null,
          conversation?.listing_area_m2
            ? `${conversation.listing_area_m2}m²`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)]">
      {/* Agent block at top (Stitch: small profile image, name, subtitle, call, more) — Back is in TopBar top-left */}
      <div className="flex items-center gap-3 py-3 px-1 border-b border-[var(--border)]">
        {otherAvatar ? (
          <img
            src={`/api/files/${otherAvatar}`}
            alt=""
            className="w-11 h-11 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: "var(--border)" }}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center font-semibold text-white text-sm"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {otherName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[var(--text-primary)] truncate">{otherName}</h2>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {listingSubtitle ?? t("chat")}
          </p>
        </div>
        {conversation?.other_agent_phone && (
          <a
            href={`tel:${conversation.other_agent_phone}`}
            className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors shrink-0"
            title={t("phoneNumber")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </a>
        )}
        {conversation?.archived_at ? (
          <button
            type="button"
            onClick={handleUnarchive}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors rounded-lg text-sm shrink-0"
            title={t("unarchive")}
          >
            {t("unarchive")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleArchive}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors rounded-lg text-sm shrink-0"
            title={t("archive")}
          >
            {t("archive")}
          </button>
        )}
      </div>

      {/* Property bar when linked to listing (Stitch: thumbnail, title, price, link) */}
      {conversation?.listing_id != null && (
        <div
          className="flex-none flex gap-3 items-center px-4 py-3 border-b border-[var(--border)]"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {conversation.listing_primary_photo ? (
            <img
              src={`/api/files/${conversation.listing_primary_photo}`}
              alt=""
              className="w-16 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-12 rounded-lg shrink-0 flex items-center justify-center text-[var(--text-muted)] text-xs"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              {t("noPhoto")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {conversation.listing_ward || `#${conversation.listing_id}`}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {conversation.listing_price_vnd != null && formatPrice(conversation.listing_price_vnd)}
              {conversation.listing_area_m2 != null && ` · ${conversation.listing_area_m2}m²`}
              {conversation.listing_property_type && ` · ${PROPERTY_TYPES[conversation.listing_property_type as keyof typeof PROPERTY_TYPES] || conversation.listing_property_type}`}
            </p>
          </div>
          <Link
            href={`/dashboard/listings/${conversation.listing_id}/view?from=messages`}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors rounded-lg"
            title={t("viewListing")}
          >
            <span className="text-lg">↗</span>
          </Link>
        </div>
      )}

      <MessageThread messages={messages} currentUserId={user?.id ?? 0} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
