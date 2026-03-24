"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Home,
  Building2,
  MessageSquare,
  Users,
  UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "feed", href: "/dashboard/feed", icon: Home, tKey: "feed" as const },
  {
    key: "listings",
    href: "/dashboard/listings",
    icon: Building2,
    tKey: "myListings" as const,
  },
  {
    key: "inquiries",
    href: "/dashboard/messages",
    icon: MessageSquare,
    tKey: "inquiries" as const,
  },
  { key: "crm", href: "/dashboard/crm", icon: Users, tKey: "crm" as const },
  {
    key: "profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    tKey: "myProfile" as const,
  },
] as const;

/** Match /dashboard/listings/123/view or .../edit */
const LISTING_VIEW_PATTERN = /^\/dashboard\/listings\/[^/]+\/view$/;
const LISTING_EDIT_PATTERN = /^\/dashboard\/listings\/[^/]+\/edit$/;

export function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const isListingView = LISTING_VIEW_PATTERN.test(pathname);
  const isListingEdit = LISTING_EDIT_PATTERN.test(pathname);
  const fromParam = searchParams.get("from");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 border-t border-[var(--border)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      {NAV_ITEMS.map(({ key, href, icon: Icon, tKey }) => {
        let active: boolean;
        if (key === "feed") {
          active = pathname === "/dashboard/feed" || (isListingView && fromParam === "feed");
        } else if (key === "listings") {
          active =
            pathname === "/dashboard/listings" ||
            isListingEdit ||
            (isListingView && fromParam === "listings");
        } else if (key === "inquiries") {
          active =
            pathname.startsWith(href) ||
            (isListingView && fromParam === "messages");
        } else {
          active = pathname.startsWith(href);
        }
        return (
          <Link
            key={key}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 relative ${
              active
                ? "text-[var(--orange)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {key === "inquiries" && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
                  style={{ backgroundColor: "var(--error)" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            {active && (
              <span className="text-[9px] font-semibold tracking-wide uppercase">
                {t(tKey)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
