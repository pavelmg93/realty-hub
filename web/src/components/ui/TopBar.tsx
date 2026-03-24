"use client";

import Link from "next/link";
import Image from "next/image";
import { LangSwitcher } from "./LangSwitcher";

const FIDT_LOGO_URL = "https://fidt.vn/wp-content/uploads/2023/04/type5-2.svg";
const HEADER_BG_OFFWHITE = "#f5f5f0";

interface TopBarProps {
  back?: boolean;
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  actions,
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 gap-3 border-b"
      style={{
        backgroundColor: HEADER_BG_OFFWHITE,
        borderColor: "rgba(0,0,0,0.08)",
      }}
    >
      <div className="min-w-[5rem] flex-shrink-0" />

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
            <Image
              src={FIDT_LOGO_URL}
              alt="FIDT"
              width={86}
              height={50}
              className="h-8 w-auto object-contain"
              unoptimized
            />
          </Link>
        )}
      </div>

      <div
        className="flex-shrink-0 flex items-center justify-end gap-2 min-w-[5rem]"
        style={{ color: "#032759" }}
      >
        <LangSwitcher />
        {actions}
      </div>
    </header>
  );
}
