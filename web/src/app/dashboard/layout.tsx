"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const { count } = await res.json();
          setUnreadCount(count);
        }
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
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
      <TopBar back={back} backHref={backHref} title={title} />
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
      // Respect ?from= param: navigate back to feed or listings
      const backDest = fromParam === "feed" ? "/dashboard/feed" : "/dashboard/listings";
      return { back: true, backHref: backDest };
    }
    if (segments[1] && segments[2] === "edit") return { back: true, backHref: `/dashboard/listings/${segments[1]}/view` };
    if (segments[1] && !segments[2]) return { back: true, backHref: "/dashboard/listings" };
  }
  if (segments[0] === "crm" && segments[1] === "person" && segments[2])
    return { back: true, backHref: "/dashboard/crm" };
  if (segments[0] === "agents" && segments[1]) return { back: true, backHref: "/dashboard/crm" };
  return { back: false };
}
