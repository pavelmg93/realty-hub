"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Conversation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
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

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );
      if (!res.ok) {
        if (res.status === 404) setError("Conversation not found");
        else if (res.status === 403)
          setError("You don't have access to this conversation");
        else setError("Failed to load messages");
        return;
      }
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const fetchConversation = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      const convo = data.conversations.find(
        (c: Conversation) => c.id === parseInt(conversationId, 10),
      );
      if (convo) setConversation(convo);
    }
  }, [conversationId]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, listing_id: conversation?.listing_id }),
      },
    );
    if (res.ok) {
      await fetchMessages();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-sm text-slate-600 hover:text-slate-800"
        >
          Back to messages
        </button>
      </div>
    );
  }

  const otherName =
    conversation?.other_agent_name ||
    conversation?.other_agent_username ||
    "Agent";

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-0">
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-slate-400 hover:text-navy text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-semibold text-slate-800">{otherName}</h2>
          {conversation && (
            <p className="text-xs text-slate-500">
              {[
                conversation.listing_property_type
                  ? PROPERTY_TYPES[
                      conversation.listing_property_type as keyof typeof PROPERTY_TYPES
                    ] || conversation.listing_property_type
                  : null,
                conversation.listing_ward,
                conversation.listing_price_vnd
                  ? formatPrice(conversation.listing_price_vnd)
                  : null,
                conversation.listing_area_m2
                  ? `${conversation.listing_area_m2}m\u00B2`
                  : null,
              ]
                .filter(Boolean)
                .join(" \u00B7 ")}
            </p>
          )}
        </div>
      </div>

      <MessageThread messages={messages} currentUserId={user?.id ?? 0} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
