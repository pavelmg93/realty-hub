"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard } from "@/components/ui/ListingCard";
import ListingCardOwner from "@/components/listings/ListingCard";
import { GridToggle } from "@/components/ui/GridToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus } from "lucide-react";
import Link from "next/link";

type Tab = "my_listings" | "favorites";
type GridCols = 1 | 2;

export default function StorePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("my_listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState<GridCols>(2);
  const restoreScrollRef = useRef<number | null>(null);

  // Restore state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realtyhub_store_state");
      if (stored) {
        const { tab, cols: c } = JSON.parse(stored);
        if (tab === "my_listings" || tab === "favorites") setActiveTab(tab);
        if (c === 1 || c === 2) setCols(c as GridCols);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem("realtyhub_store_state", JSON.stringify({ tab: activeTab, cols }));
    } catch {}
  }, [activeTab, cols]);

  // Restore scroll
  useEffect(() => {
    try {
      const savedY = sessionStorage.getItem("realtyhub_scroll_store");
      if (savedY) {
        sessionStorage.removeItem("realtyhub_scroll_store");
        restoreScrollRef.current = parseInt(savedY, 10);
      }
    } catch {}
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "my_listings") {
        const res = await fetch("/api/listings?archived=false");
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings);
        }
      } else {
        const res = await fetch("/api/feed?is_favorited=true&limit=100");
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Apply saved scroll position after data loads
  useEffect(() => {
    if (!loading && restoreScrollRef.current !== null) {
      const y = restoreScrollRef.current;
      restoreScrollRef.current = null;
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "instant" });
      });
    }
  }, [loading]);

  const saveScrollAndNavigate = (url: string) => {
    try {
      sessionStorage.setItem("realtyhub_scroll_store", String(window.scrollY));
    } catch {}
    router.push(url);
  };

  const handleReactivate = async (id: number) => {
    const res = await fetch(`/api/listings/${id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: false }),
    });
    if (res.ok) fetchListings();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) fetchListings();
  };

  const currentUserId = user?.id ?? 0;

  return (
    <div className="px-4 sm:px-6 max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("myStore")}
        </h1>
        <div className="flex items-center gap-2">
          <GridToggle value={cols} onChange={setCols} />
          <Link
            href="/dashboard/listings/new"
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: "var(--orange)" }}
          >
            <Plus size={16} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {(["my_listings", "favorites"] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? "text-white" : "text-[var(--text-muted)]"
              }`}
              style={isActive ? { backgroundColor: "var(--orange)" } : undefined}
            >
              {tab === "my_listings" ? t("myListings") : t("myFavorites")}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-3">
            {activeTab === "my_listings" ? t("noListings") : t("noResults")}
          </p>
          {activeTab === "my_listings" && (
            <Link
              href="/dashboard/listings/new"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white inline-block"
              style={{ backgroundColor: "var(--orange)" }}
            >
              {t("addListing")}
            </Link>
          )}
        </div>
      ) : activeTab === "my_listings" ? (
        <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {listings.map((listing) => (
            <ListingCardOwner
              key={listing.id}
              listing={listing}
              isArchived={false}
              isOwner
              cols={cols}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
              onBeforeNavigate={() => {
                try {
                  sessionStorage.setItem("realtyhub_scroll_store", String(window.scrollY));
                } catch {}
              }}
            />
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={{
                ...listing,
                is_owner: listing.agent_id === currentUserId,
                has_conversation: !!listing.existing_conversation_id,
              }}
              cols={cols}
              viewSearch="?from=store"
              onMessage={() => {
                saveScrollAndNavigate(`/dashboard/listings/${listing.id}/view?from=store#messages`);
              }}
              onViewMessages={() => {
                saveScrollAndNavigate(`/dashboard/listings/${listing.id}/view?from=store#messages`);
              }}
              onBeforeNavigate={() => {
                try {
                  sessionStorage.setItem("realtyhub_scroll_store", String(window.scrollY));
                } catch {}
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
