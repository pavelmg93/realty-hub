"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { formatPrice, generateTitleStandardized } from "@/lib/constants";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [agent, setAgent] = useState<{
    id: number;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    zalo_id: string | null;
    dob_year: number | null;
    listing_count: number;
  } | null>(null);
  const [contactVisible, setContactVisible] = useState<Record<string, boolean>>({
    phone: true,
    email: true,
    zalo: true,
    whatsapp: false,
  });
  const [listings, setListings] = useState<Array<{
    id: number;
    ward: string | null;
    ward_new: string | null;
    street: string | null;
    price_vnd: number | null;
    property_type: string | null;
    area_m2: number | null;
    status: string;
    primary_photo: string | null;
    title_standardized: string | null;
    num_floors: number | null;
    frontage_m: number | null;
    depth_m: number | null;
    price_short: string | null;
    commission: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/agents/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent ?? null);
          setListings(Array.isArray(data.listings) ? data.listings : []);
        } else {
          const listRes = await fetch("/api/listings", { credentials: "include" });
          if (listRes.ok) {
            const listData = await listRes.json();
            setListings(Array.isArray(listData.listings) ? listData.listings : []);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  const displayName = agent?.first_name || agent?.username || user?.first_name || user?.username || "?";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = agent?.avatar_url ? `/api/files/${agent.avatar_url}` : null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/agents/me/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAgent((a) => (a ? { ...a, avatar_url: data.avatar_url } : null));
        refreshUser();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto text-center py-12 text-[var(--text-muted)]">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {t("myProfile")}
      </h1>

      <div
        className="relative rounded-xl overflow-hidden border border-[var(--border)] mb-6"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div
          className="h-24 w-full"
          style={{
            background: "linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(44, 58, 80, 0.9) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center -mt-12 px-6 pb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group rounded-full border-4 shrink-0"
            style={{ borderColor: "var(--bg-surface)" }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-2xl"
                style={{ backgroundColor: "var(--orange)" }}
              >
                {initials}
              </div>
            )}
            <span
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
            >
              {uploading ? "..." : t("edit")}
            </span>
          </button>
          <h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">
            {displayName}
          </h2>
          {(agent?.username || user?.username) && (
            <p className="text-sm text-[var(--orange)] font-medium">@{agent?.username || user?.username}</p>
          )}
          {agent != null && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {agent.listing_count} listing{agent.listing_count !== 1 ? "s" : ""}
            </p>
          )}
          <div className="mt-4 w-full">
            <Link
              href="/dashboard/listings/new"
              className="block w-full py-2 px-4 text-white text-sm font-medium rounded-lg text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--orange)" }}
            >
              {t("addListing")}
            </Link>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("sharedOnListings")}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: "rgba(22, 163, 74, 0.15)", color: "var(--status-open)" }}
          >
            {t("publicView")}
          </span>
        </div>
        <div
          className="rounded-xl overflow-hidden border border-[var(--border)]"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {/* Phone — toggle next to row per Stitch */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--orange)]"
                style={{ backgroundColor: "rgba(232, 119, 34, 0.15)" }}
              >
                <span className="text-lg">📞</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t("phoneNumber")}</p>
                <p className="text-xs text-[var(--text-muted)]">{agent?.phone || user?.phone || "—"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={contactVisible.phone}
                onChange={() => setContactVisible((v) => ({ ...v, phone: !v.phone }))}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full border border-[var(--border)] transition-colors ${
                  contactVisible.phone ? "bg-[var(--orange)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white border border-[var(--border)] transition-transform ${
                    contactVisible.phone ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>
          {/* Email */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--info)]"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                <span className="text-lg">✉</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t("email")}</p>
                <p className="text-xs text-[var(--text-muted)]">{agent?.email || user?.email || "—"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={contactVisible.email}
                onChange={() => setContactVisible((v) => ({ ...v, email: !v.email }))}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full border border-[var(--border)] transition-colors ${
                  contactVisible.email ? "bg-[var(--orange)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white border border-[var(--border)] transition-transform ${
                    contactVisible.email ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>
          {/* Zalo */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-indigo-500"
                style={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
              >
                <span className="text-xs font-bold">Zalo</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t("zalo")}</p>
                <p className="text-xs text-[var(--text-muted)]">{agent?.zalo_id ?? "—"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={contactVisible.zalo}
                onChange={() => setContactVisible((v) => ({ ...v, zalo: !v.zalo }))}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full border border-[var(--border)] transition-colors ${
                  contactVisible.zalo ? "bg-[var(--orange)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white border border-[var(--border)] transition-transform ${
                    contactVisible.zalo ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>
          {/* WhatsApp — Not connected placeholder per Stitch */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
              >
                <span className="text-lg">💬</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t("whatsapp")}</p>
                <p className="text-xs text-[var(--text-muted)]">{t("notConnected")}</p>
              </div>
            </div>
            <span className="w-11 h-6 rounded-full bg-[var(--border)] shrink-0 opacity-60 flex items-center justify-end pr-[2px]" aria-hidden>
              <span className="w-5 h-5 rounded-full bg-white/80 border border-[var(--border)]" />
            </span>
          </div>
        </div>
      </section>

      {/* DOB Year */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
          {lang === "vi" ? "Năm sinh" : "Year of Birth"}
        </h3>
        <div
          className="rounded-xl overflow-hidden border border-[var(--border)] p-4"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1950}
              max={2010}
              value={agent?.dob_year ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setAgent((a) => a ? { ...a, dob_year: val } : null);
              }}
              onBlur={async () => {
                if (!agent) return;
                await fetch("/api/agents/me", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ dob_year: agent.dob_year }),
                });
              }}
              placeholder={lang === "vi" ? "VD: 1993" : "e.g. 1993"}
              className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {lang === "vi" ? "Hiển thị trên thẻ BĐS của bạn" : "Shown on your listing cards"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
          {t("myListings")} ({listings.length})
        </h3>
        <div className="space-y-2">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/dashboard/listings/${listing.id}/view?from=profile`}
              className="flex gap-3 p-3 rounded-xl border border-[var(--border)] transition-colors hover:border-[var(--orange)]/50"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              {listing.primary_photo ? (
                <img
                  src={`/api/files/${listing.primary_photo}`}
                  alt=""
                  className="w-16 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-12 rounded-lg shrink-0 flex items-center justify-center text-[var(--text-muted)] text-xs"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  {t("noPhoto")}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {listing.street || `#${listing.id}`}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {listing.title_standardized || generateTitleStandardized(listing)}
                </p>
              </div>
            </Link>
          ))}
          {listings.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              {t("noListings")}
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="w-full py-2 px-4 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors"
        >
          {lang === "vi" ? "Đăng xuất" : "Log out"}
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center mt-4">
        Realty Hub · Wealth Realty
      </p>
    </div>
  );
}
