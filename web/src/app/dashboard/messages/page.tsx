"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Conversation } from "@/lib/types";
import ConversationList from "@/components/messages/ConversationList";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelect = (id: number) => {
    router.push(`/dashboard/messages/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Messages</h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <ConversationList
            conversations={conversations}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}
