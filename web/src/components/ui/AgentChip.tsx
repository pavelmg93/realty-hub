"use client";

import Link from "next/link";

interface AgentChipProps {
  agent: {
    id: number;
    first_name: string | null;
    username: string | null;
    phone?: string | null;
  };
  size?: "sm" | "md";
  showOnline?: boolean;
  clickable?: boolean;
}

export function AgentChip({
  agent,
  size = "sm",
  showOnline = false,
  clickable = true,
}: AgentChipProps) {
  const displayName = agent.first_name || agent.username || "?";
  const initials = displayName.slice(0, 2).toUpperCase();
  const inner = (
    <div
      className={`flex items-center gap-2 ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      <div className="relative flex-shrink-0">
        <div
          className={`rounded-full flex items-center justify-center font-bold text-white ${
            size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
          }`}
          style={{ backgroundColor: "var(--orange)" }}
        >
          {initials}
        </div>
        {showOnline && (
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[var(--bg-surface)]"
            style={{ backgroundColor: "var(--status-open)" }}
          />
        )}
      </div>
      <span className="text-[var(--text-secondary)] font-medium">
        {displayName}
      </span>
    </div>
  );

  if (!clickable) return inner;
  return (
    <Link
      href="/dashboard/crm?tab=agents"
      className="hover:opacity-80 transition-opacity"
    >
      {inner}
    </Link>
  );
}
