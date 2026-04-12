"use client";

import Link from "next/link";
import { LangSwitcher } from "./LangSwitcher";
import { Bell } from "lucide-react";

const HEADER_BG_OFFWHITE = "#f5f5f0";

interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
  notificationCount?: number;
}

export function TopBar({
  title,
  actions,
  notificationCount = 0,
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 gap-3 border-b"
      style={{
        backgroundColor: HEADER_BG_OFFWHITE,
        borderColor: "rgba(0,0,0,0.08)",
      }}
    >
      <div className="min-w-[5rem] flex-shrink-0 flex items-center">
      </div>

      <div className="flex-1 flex items-center justify-center min-w-0">
        {title ? (
          <h1
            className="text-sm font-semibold truncate"
            style={{ color: "#032759" }}
          >
            {title}
          </h1>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: "#2563eb" }}>
              RealtyHub
            </span>
          </Link>
        )}
      </div>

      <div
        className="flex-shrink-0 flex items-center justify-end gap-2 min-w-[5rem]"
        style={{ color: "#032759" }}
      >
        <Link href="/dashboard/notifications" className="relative p-1">
          <Bell size={20} strokeWidth={1.8} />
          {notificationCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
              style={{ backgroundColor: "#ef4444" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>
        <LangSwitcher />
        {actions}
      </div>
    </header>
  );
}
