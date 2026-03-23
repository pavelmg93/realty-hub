"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  messages: Message[];
  currentUserId: number;
}

export default function MessageThread({ messages, currentUserId }: Props) {
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-[var(--text-muted)] text-sm">
        {t("noMessagesThread")}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                isMine ? "text-white" : "text-[var(--text-primary)]"
              }`}
              style={
                isMine
                  ? { backgroundColor: "var(--orange)" }
                  : { backgroundColor: "var(--bg-elevated)" }
              }
            >
              {!isMine && msg.sender_name && (
                <p className="text-xs font-medium mb-0.5 opacity-70">
                  {msg.sender_name}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              <p
                className={`text-xs mt-1 ${isMine ? "text-white/70" : "text-[var(--text-muted)]"}`}
              >
                {new Date(msg.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
