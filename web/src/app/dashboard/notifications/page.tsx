"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, MessageSquare, Home, TrendingDown, Heart } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  new_message: MessageSquare,
  new_listing: Home,
  price_change: TrendingDown,
  listing_favorited: Heart,
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=50")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id: notif.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
    }
    if (notif.link) router.push(notif.link);
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="px-4 sm:px-6 max-w-3xl mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("notifications")}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm text-[var(--orange)] hover:underline"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto mb-3 text-[var(--text-muted)]" strokeWidth={1} />
          <p className="text-[var(--text-muted)]">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            const timeAgo = formatTimeAgo(notif.created_at);
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleClick(notif)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  notif.is_read
                    ? "border-[var(--border)] opacity-60"
                    : "border-[var(--orange)]/30"
                }`}
                style={{ backgroundColor: notif.is_read ? "var(--bg-surface)" : "var(--bg-elevated)" }}
              >
                <div className={`p-2 rounded-full shrink-0 ${notif.is_read ? "text-[var(--text-muted)]" : "text-[var(--orange)]"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${notif.is_read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{notif.body}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: "var(--orange)" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
