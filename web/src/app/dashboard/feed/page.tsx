"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard } from "@/components/ui/ListingCard";
import { GridToggle } from "@/components/ui/GridToggle";
import FeedFilters, {
  FeedFilterValues,
  DEFAULT_FILTERS,
} from "@/components/feed/FeedFilters";
import DynamicFeedMap from "@/components/map/DynamicFeedMap";
import { useLanguage } from "@/contexts/LanguageContext";
import { LAYOUT } from "@/lib/layout-constants";
import { Filter, Map } from "lucide-react";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

type ViewMode = "grid" | "map";
type GridCols = 1 | 2;

export default function FeedPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedFilterValues>({ ...DEFAULT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cols, setCols] = useState<GridCols>(2);
  const [agents, setAgents] = useState<{ id: number; first_name: string | null; username: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("Nha Trang");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore view mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realtyhub_feed_view_mode");
      if (stored) {
        const { viewMode: vm, cols: c } = JSON.parse(stored);
        if (vm === "grid" || vm === "map") setViewMode(vm);
        if (c === 1 || c === 2) setCols(c as GridCols);
      }
    } catch {}
  }, []);

  // Persist view mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("realtyhub_feed_view_mode", JSON.stringify({ viewMode, cols }));
    } catch {}
  }, [viewMode, cols]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.ok ? r.json() : { agents: [] })
      .then((d) => setAgents(d.agents || []))
      .catch(() => setAgents([]));
  }, []);

  const fetchFeed = useCallback(
    async (page = 1, q?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", viewMode === "map" ? "200" : "20");
        params.set("sort", filters.sort);
        params.set("order", filters.order);
        const query = q !== undefined ? q : searchQuery;
        if (query.trim()) params.set("q", query.trim());
        if (city) params.set("city", city);
        for (const [key, value] of Object.entries(filters)) {
          if (value && key !== "sort" && key !== "order") {
            params.set(key, value);
          }
        }
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings);
          setPagination(data.pagination);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, viewMode, searchQuery, city]
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Debounce search — when searchQuery changes, wait 300ms then fetch
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchFeed(1, value);
    }, 300);
  };

  const handleMessage = (listing: Listing) => {
    router.push(`/dashboard/listings/${listing.id}/view?from=feed#messages`);
  };

  const handleApplyFilters = () => fetchFeed(1);
  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });
  const currentUserId = user?.id ?? 0;

  const CITIES = ["Nha Trang", "Hà Nội", "TP.HCM", "Đà Nẵng"];

  return (
    <div className={`px-4 sm:px-6 max-w-3xl mx-auto pt-4${viewMode === "grid" ? " pb-4" : ""}`}>
      {/* Header + city selector */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("listingsFeed")}
        </h1>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-2 py-1.5 focus:outline-none focus:border-[var(--orange)]"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Unified toolbar — h-12 (48px) in map mode, normal in grid mode */}
      <div className={`flex items-center gap-2 ${viewMode === "map" ? "h-12" : "mb-3"}`}>
        {/* Search */}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("searchListings") || "Tìm kiếm địa chỉ, phường, mô tả..."}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--orange)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filter */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex flex-none items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--border)] transition-colors ${
            showFilters ? "text-white" : "text-[var(--text-secondary)]"
          }`}
          style={showFilters ? { backgroundColor: "var(--orange)" } : { backgroundColor: "var(--bg-surface)" }}
        >
          <Filter size={16} /> {t("filter")}
        </button>

        {/* Grid toggle */}
        {viewMode === "grid" && (
          <GridToggle value={cols} onChange={setCols} />
        )}

        {/* Map toggle */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
          className="inline-flex flex-none items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <Map size={16} /> {viewMode === "map" ? t("grid") : t("map")}
        </button>
      </div>

      {/* Listing count — hidden in map mode */}
      {viewMode !== "map" && !loading && (
        <div className="mb-3 text-sm text-[var(--text-muted)]">
          {pagination.total} {t("listings")}
          {searchQuery && <span className="ml-1 text-[var(--orange)]">"{searchQuery}"</span>}
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <FeedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          agents={agents}
        />
      )}

      {/* Content */}
      {viewMode === "map" ? (
        <div className="overflow-hidden">
          <DynamicFeedMap
            listings={listings}
            onListingClick={(l) => router.push(`/dashboard/listings/${l.id}/view?from=feed`)}
            height={LAYOUT.MAP_HEIGHT}
          />
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-2">{t("noResults")}</p>
          {(searchQuery || Object.values(filters).some(v => v && v !== "created_at" && v !== "desc")) && (
            <button
              type="button"
              onClick={() => {
                handleSearchChange("");
                handleResetFilters();
              }}
              className="text-sm text-[var(--orange)] hover:underline"
            >
              {t("reset")} {t("filter")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`grid gap-3 ${
              cols === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  is_owner: listing.agent_id === currentUserId,
                  has_conversation: !!listing.existing_conversation_id,
                }}
                cols={cols}
                viewSearch="?from=feed"
                onMessage={() => handleMessage(listing)}
                onViewMessages={() => {
                  router.push(`/dashboard/listings/${listing.id}/view?from=feed#messages`);
                }}
              />
            ))}
          </div>
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => fetchFeed(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                {t("previous")}
              </button>
              <span className="text-sm text-[var(--text-muted)]">
                {t("pageOf")} {pagination.page} / {pagination.total_pages}
              </span>
              <button
                type="button"
                onClick={() => fetchFeed(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
