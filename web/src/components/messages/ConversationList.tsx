"use client";

import { Conversation } from "@/lib/types";
import { PROPERTY_TYPES, formatPrice } from "@/lib/constants";

interface Props {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (id: number) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
}: Props) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
            activeId === c.id ? "bg-navy/5" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-slate-800">
              {c.other_agent_name || c.other_agent_username || "Agent"}
            </span>
            {(c.unread_count ?? 0) > 0 && (
              <span className="bg-accent text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-medium">
                {c.unread_count}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {[
              c.listing_property_type
                ? PROPERTY_TYPES[
                    c.listing_property_type as keyof typeof PROPERTY_TYPES
                  ] || c.listing_property_type
                : null,
              c.listing_ward,
              c.listing_price_vnd ? formatPrice(c.listing_price_vnd) : null,
              c.listing_area_m2 ? `${c.listing_area_m2}m²` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {c.last_message_preview && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {c.last_message_preview}
            </p>
          )}
          {c.last_message_at && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(c.last_message_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
