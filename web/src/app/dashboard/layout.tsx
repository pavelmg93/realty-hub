"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch("/api/messages/unread-count"),
          fetch("/api/notifications?unread=true&limit=1"),
        ]);
        if (msgRes.ok) {
          const { count } = await msgRes.json();
          setUnreadCount(count);
        }
        if (notifRes.ok) {
          const { unread_count } = await notifRes.json();
          setNotifCount(unread_count);
        }
      } catch {
        // ignore
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const fromParam = searchParams.get("from");
  const { back, backHref, title } = getTopBarNav(pathname, fromParam);

  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div className="animate-pulse text-[var(--text-muted)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <TopBar back={back} backHref={backHref} title={title} notificationCount={notifCount} />
      <main className="flex-1 pt-14 pb-16">{children}</main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}

function getTopBarNav(pathname: string | null, fromParam?: string | null): {
  back: boolean;
  backHref?: string;
  title?: string;
} {
  if (!pathname || !pathname.startsWith("/dashboard")) return { back: false };
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) return { back: false };
  if (segments[0] === "messages" && segments[1]) return { back: true, backHref: "/dashboard/messages" };
  if (segments[0] === "listings") {
    if (segments[1] && segments[2] === "view") {
      const backDest = fromParam === "feed" ? "/dashboard/feed" : fromParam === "store" ? "/dashboard/store" : "/dashboard/listings";
      return { back: true, backHref: backDest };
    }
    if (segments[1] && segments[2] === "edit") return { back: true, backHref: `/dashboard/listings/${segments[1]}/view` };
    if (segments[1] && !segments[2]) return { back: true, backHref: "/dashboard/listings" };
  }
  if (segments[0] === "crm" && segments[1] === "person" && segments[2])
    return { back: true, backHref: "/dashboard/crm" };
  if (segments[0] === "agents" && segments[1]) return { back: true, backHref: "/dashboard/crm" };
  if (segments[0] === "notifications") return { back: true, backHref: "/dashboard/feed" };
  return { back: false };
}
