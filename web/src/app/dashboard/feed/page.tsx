"use client";

import { useState, useCallback, useEffect } from "react";
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

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.ok ? r.json() : { agents: [] })
      .then((d) => setAgents(d.agents || []))
      .catch(() => setAgents([]));
  }, []);

  const fetchFeed = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", viewMode === "map" ? "200" : "20");
        params.set("sort", filters.sort);
        params.set("order", filters.order);
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
    [filters, viewMode]
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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
    <div className="p-3">
      <div className="flex items-center justify-between gap-4 mb-4">
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
        <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">{t("noResults")}</div>
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
