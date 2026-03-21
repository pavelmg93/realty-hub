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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

type ViewMode = "grid" | "map";
type GridCols = 1 | 2 | 3;

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
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    [filters, viewMode, searchQuery]
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
    if (!listing.agent_id) return;
    router.push(
      `/dashboard/messages/new?listing_id=${listing.id}&agent_id=${listing.agent_id}`
    );
  };

  const handleApplyFilters = () => fetchFeed(1);
  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });
  const currentUserId = user?.id ?? 0;

  return (
    <div className="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
      {/* Search bar */}
      <div className="relative mb-3">
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

      <div className="flex items-center justify-between gap-4 mb-3">
        <GridToggle value={cols} onChange={setCols} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {t("mapView")}
          </span>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
            className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--orange)] ${
              viewMode === "map" ? "bg-[var(--orange)]" : "bg-[var(--bg-elevated)]"
            }`}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ left: viewMode === "map" ? "22px" : "4px" }}
            />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showFilters
              ? "bg-[var(--orange)] text-white"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          {t("filter")}
        </button>
        {!loading && (
          <span className="text-sm text-[var(--text-muted)]">
            {pagination.total} {t("listings")}
            {searchQuery && <span className="ml-1 text-[var(--orange)]">"{searchQuery}"</span>}
          </span>
        )}
      </div>

      {showFilters && (
        <FeedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          agents={agents}
        />
      )}

      {loading ? (
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
      ) : viewMode === "map" ? (
        <DynamicFeedMap
          listings={listings}
          onListingClick={(l) => router.push(`/dashboard/listings/${l.id}/view?from=feed`)}
          height="calc(100vh - 220px)"
        />
      ) : (
        <>
          <div
            className={`grid gap-3 ${
              cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3"
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
                  if (listing.existing_conversation_id)
                    router.push(`/dashboard/messages/${listing.existing_conversation_id}`);
                  else
                    router.push("/dashboard/messages");
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
