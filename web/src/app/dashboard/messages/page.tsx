"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Conversation } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/constants";
import { getPropertyTypeKey } from "@/lib/i18n";
import { ChevronDown, ChevronRight, Building2, User } from "lucide-react";

type GroupBy = "property" | "agent";

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const currentUserId = user?.id ?? 0;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("property");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const url = showArchived ? "/api/conversations?archived=1" : "/api/conversations";
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    setLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  const groups = useMemo(() => {
    if (groupBy === "property") {
      const byListing = new Map<
        number | "general",
        { listingId: number | null; label: string; conversations: Conversation[] }
      >();
      for (const c of conversations) {
        const propKey = c.listing_property_type ? getPropertyTypeKey(c.listing_property_type) : null;
        const label =
          c.listing_id == null
            ? t("generalChat")
            : [
                propKey ? t(propKey) : c.listing_property_type ?? null,
                c.listing_ward,
                c.listing_price_vnd ? formatPrice(c.listing_price_vnd) : null,
                c.listing_area_m2 ? `${c.listing_area_m2}m²` : null,
              ]
                .filter(Boolean)
                .join(" · ");
        const key = c.listing_id ?? "general";
        const existing = byListing.get(key);
        if (existing) existing.conversations.push(c);
        else byListing.set(key, { listingId: c.listing_id ?? null, label, conversations: [c] });
      }
      return Array.from(byListing.values()).sort(
        (a, b) =>
          new Date(b.conversations[0]?.updated_at ?? 0).getTime() -
          new Date(a.conversations[0]?.updated_at ?? 0).getTime()
      );
    }
    const byAgent = new Map<
      number,
      { agentId: number; name: string; conversations: Conversation[] }
    >();
    for (const c of conversations) {
      const otherId = c.agent_1_id === currentUserId ? c.agent_2_id : c.agent_1_id;
      const name =
        (c.other_agent_name || c.other_agent_username || `Agent ${otherId}`) as string;
      const existing = byAgent.get(otherId);
      if (existing) existing.conversations.push(c);
      else byAgent.set(otherId, { agentId: otherId, name, conversations: [c] });
    }
    return Array.from(byAgent.values()).sort(
      (a, b) =>
        new Date(b.conversations[0]?.updated_at ?? 0).getTime() -
        new Date(a.conversations[0]?.updated_at ?? 0).getTime()
    );
  }, [conversations, groupBy, currentUserId, t]);

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelect = (id: number) => {
    router.push(`/dashboard/messages/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-3">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{t("inquiries")}</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            {t("showArchived")}
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setGroupBy("property")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
              groupBy === "property" ? "text-white" : "text-[var(--text-muted)]"
            }`}
            style={
              groupBy === "property"
                ? { backgroundColor: "var(--orange)" }
                : { backgroundColor: "var(--bg-surface)" }
            }
          >
            <Building2 size={14} /> {t("properties")}
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("agent")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
              groupBy === "agent" ? "text-white" : "text-[var(--text-muted)]"
            }`}
            style={
              groupBy === "agent"
                ? { backgroundColor: "var(--orange)" }
                : { backgroundColor: "var(--bg-surface)" }
            }
          >
            <User size={14} /> {t("agents")}
          </button>
        </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
      ) : conversations.length === 0 ? (
        <div
          className="rounded-xl border border-[var(--border)] py-12 text-center text-[var(--text-muted)]"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {t("noConversations")}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden border border-[var(--border)]"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {groups.map((group) => {
            const key =
              groupBy === "property"
                ? `p-${(group as { listingId: number | null }).listingId ?? "general"}`
                : `a-${(group as { agentId: number }).agentId}`;
            const isCollapsed = collapsed.has(key);
            return (
              <div key={key} className="border-b border-[var(--border)] last:border-b-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(key)}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  {groupBy === "property" ? (
                    (group as { listingId: number | null }).listingId != null ? (
                      <Link
                        href={`/dashboard/listings/${(group as { listingId: number }).listingId}/view?from=messages`}
                        className="flex-1 py-3 px-2 text-left font-medium text-sm text-[var(--text-primary)] hover:underline"
                      >
                        {(group as { label: string }).label}
                      </Link>
                    ) : (
                      <span className="flex-1 py-3 px-2 font-medium text-sm text-[var(--text-primary)]">
                        {(group as { label: string }).label}
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/crm?tab=agents")}
                      className="flex-1 py-3 px-2 text-left font-medium text-sm text-[var(--text-primary)] hover:underline"
                    >
                      {(group as { agentId: number; name: string }).name}
                    </button>
                  )}
                  <span className="text-xs text-[var(--text-muted)] px-2">
                    {(group as { conversations: Conversation[] }).conversations.length}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {(group as { conversations: Conversation[] }).conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c.id)}
                        className="w-full text-left px-4 py-3 pl-10 hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {groupBy === "property"
                              ? (c.other_agent_name ?? c.other_agent_username ?? t("agent"))
                              : (() => {
                                  const propKey = c.listing_property_type ? getPropertyTypeKey(c.listing_property_type) : null;
                                  return [
                                    propKey ? t(propKey) : (c.listing_property_type ?? null),
                                    c.listing_ward,
                                    c.listing_price_vnd ? formatPrice(c.listing_price_vnd) : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ");
                                })()}
                          </span>
                          {(c.unread_count ?? 0) > 0 && (
                            <span
                              className="text-xs font-medium rounded-full px-1.5 py-0.5 text-white"
                              style={{ backgroundColor: "var(--orange)" }}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        {c.last_message_preview && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                            {c.last_message_preview}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
