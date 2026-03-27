"use client";

import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard } from "@/components/ui/ListingCard";
import ListingCardOwner from "@/components/listings/ListingCard";
import { ViewModeToggle, ViewMode } from "@/components/ui/ViewModeToggle";
import FeedFilters, {
  FeedFilterValues,
  DEFAULT_FILTERS,
} from "@/components/feed/FeedFilters";
import DynamicFeedMap from "@/components/map/DynamicFeedMap";
import { useLanguage } from "@/contexts/LanguageContext";
import { LAYOUT } from "@/lib/layout-constants";
import { Plus, Filter, Bookmark } from "lucide-react";
import Link from "next/link";
import SaveSearchModal from "@/components/feed/SaveSearchModal";

type Tab = "my_listings" | "favorites";

export default function StorePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("my_listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("2col");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filters, setFilters] = useState<FeedFilterValues>({ ...DEFAULT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const restoreScrollRef = useRef<number | null>(null);

  // Restore state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realtyhub_store_state");
      if (stored) {
        const { tab, viewMode: vm } = JSON.parse(stored);
        if (tab === "my_listings" || tab === "favorites") setActiveTab(tab);
        if (vm === "1col" || vm === "2col" || vm === "map") setViewMode(vm);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem("realtyhub_store_state", JSON.stringify({ tab: activeTab, viewMode }));
    } catch {}
  }, [activeTab, viewMode]);

  // Restore scroll + filters
  useEffect(() => {
    try {
      const savedY = sessionStorage.getItem("realtyhub_scroll_store");
      if (savedY) {
        sessionStorage.removeItem("realtyhub_scroll_store");
        restoreScrollRef.current = parseInt(savedY, 10);
      }
      const savedFilters = sessionStorage.getItem("realtyhub_filters_store");
      if (savedFilters) {
        sessionStorage.removeItem("realtyhub_filters_store");
        setFilters(JSON.parse(savedFilters));
      }
      const savedSearch = sessionStorage.getItem("realtyhub_search_store");
      if (savedSearch) {
        sessionStorage.removeItem("realtyhub_search_store");
        setSearchQuery(savedSearch);
        setActiveSearch(savedSearch);
      }
    } catch {}
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeSearch.trim()) params.set("q", activeSearch.trim());
      params.set("sort", filters.sort);
      params.set("order", filters.order);
      for (const [key, value] of Object.entries(filters)) {
        if (value && key !== "sort" && key !== "order") {
          params.set(key, value);
        }
      }

      if (activeTab === "my_listings") {
        params.set("archived", "false");
        const res = await fetch(`/api/listings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings);
        }
      } else {
        params.set("is_favorited", "true");
        params.set("limit", "100");
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeSearch, filters]);

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
      sessionStorage.setItem("realtyhub_filters_store", JSON.stringify(filters));
      if (activeSearch) sessionStorage.setItem("realtyhub_search_store", activeSearch);
    } catch {}
    router.push(url);
  };

  const handleSearchSubmit = () => setActiveSearch(searchQuery);
  const handleSearchClear = () => { setSearchQuery(""); setActiveSearch(""); };
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearchSubmit(); }
  };
  const handleApplyFilters = () => fetchListings();
  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sort" && k !== "order",
  ).length;

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

  const cols = viewMode === "1col" ? 1 : 2;

  return (
    <div className={`px-4 sm:px-6 max-w-3xl mx-auto pt-4${viewMode !== "map" ? " pb-4" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("myStore")}
        </h1>
        <Link
          href="/dashboard/listings/new"
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: "var(--orange)" }}
        >
          <Plus size={16} />
        </Link>
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

      {/* Unified toolbar: search + filter + view mode */}
      <div className={`flex items-center gap-2 ${viewMode === "map" ? "mb-2" : "mb-3"}`}>
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("searchListings") || "Tìm kiếm địa chỉ, phường, mô tả..."}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--orange)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              &times;
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex flex-none items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
            showFilters
              ? "text-white border-[var(--orange)]"
              : activeFilterCount > 0
                ? "text-[var(--orange)] border-[var(--orange)]"
                : "text-[var(--text-secondary)] border-[var(--border)]"
          }`}
          style={showFilters ? { backgroundColor: "var(--orange)" } : { backgroundColor: "var(--bg-surface)" }}
        >
          <Filter size={16} /> {t("filter")}{activeFilterCount > 0 && !showFilters ? ` (${activeFilterCount})` : ""}
        </button>
        {/* Save Search */}
        <button
          type="button"
          onClick={() => setShowSaveSearch(true)}
          className="inline-flex flex-none items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--orange)] transition-colors"
          style={{ backgroundColor: "var(--bg-surface)" }}
          title={t("saveSearch")}
        >
          <Bookmark size={16} />
        </button>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <FeedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onCollapse={() => setShowFilters(false)}
        />
      )}

      {/* Listing count — stable height */}
      <div className={`text-sm text-[var(--text-muted)] ${viewMode === "map" ? "my-1" : "mb-3"}`} style={{ minHeight: "1.5rem" }}>
        {loading ? (
          <span className="opacity-50">— {t("listings")}</span>
        ) : (
          <>
            {listings.length} {t("listings")}
            {activeSearch && <span className="ml-1 text-[var(--orange)]">"{activeSearch}"</span>}
          </>
        )}
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="overflow-hidden">
          <DynamicFeedMap
            listings={listings}
            onListingClick={(l) => saveScrollAndNavigate(`/dashboard/listings/${l.id}/view?from=store`)}
            height={LAYOUT.MAP_HEIGHT}
          />
        </div>
      ) : loading ? (
        <div className={`grid gap-3 ${viewMode === "1col" ? "grid-cols-1" : "grid-cols-2"}`}>
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
        <div className={`grid gap-3 ${viewMode === "1col" ? "grid-cols-1" : "grid-cols-2"}`}>
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
                  sessionStorage.setItem("realtyhub_filters_store", JSON.stringify(filters));
                  if (activeSearch) sessionStorage.setItem("realtyhub_search_store", activeSearch);
                } catch {}
              }}
            />
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 ${viewMode === "1col" ? "grid-cols-1" : "grid-cols-2"}`}>
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
                  sessionStorage.setItem("realtyhub_filters_store", JSON.stringify(filters));
                  if (activeSearch) sessionStorage.setItem("realtyhub_search_store", activeSearch);
                } catch {}
              }}
            />
          ))}
        </div>
      )}

      <SaveSearchModal
        open={showSaveSearch}
        onClose={() => setShowSaveSearch(false)}
        onSaved={() => {}}
        searchQuery={activeSearch}
        filters={filters}
      />
    </div>
  );
}
