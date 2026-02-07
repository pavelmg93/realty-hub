"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Conversation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
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
        body: JSON.stringify({ body }),
      },
    );
    if (res.ok) {
      await fetchMessages();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-sm text-gray-600 hover:text-gray-800"
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
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 pb-4 border-b mb-0">
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          &larr; Back
        </button>
        <h2 className="font-semibold">{otherName}</h2>
      </div>

      <MessageThread messages={messages} currentUserId={user?.id ?? 0} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
