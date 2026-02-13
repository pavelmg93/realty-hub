"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import FeedCard from "@/components/feed/FeedCard";
import FeedFilters, {
  FeedFilterValues,
  DEFAULT_FILTERS,
} from "@/components/feed/FeedFilters";
import DynamicFeedMap from "@/components/map/DynamicFeedMap";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

type ViewMode = "grid" | "map";

export default function FeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedFilterValues>({
    ...DEFAULT_FILTERS,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
    [filters, viewMode],
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleMessage = async (listing: Listing) => {
    if (!listing.agent_id) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          other_agent_id: listing.agent_id,
          listing_id: listing.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/messages/${data.conversation.id}`);
      }
    } catch {
      // silently fail
    }
  };

  const handleListingClick = (listing: Listing) => {
    router.push(`/dashboard/listings/${listing.id}/view`);
  };

  const handleApplyFilters = () => {
    fetchFeed(1);
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Feed</h1>
          {!loading && (
            <span className="text-sm text-slate-500">
              {pagination.total} listing{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-navy text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === "map"
                  ? "bg-navy text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Map view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
              showFilters
                ? "bg-navy text-white border-navy"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
        </div>
      </div>

      {showFilters && (
        <FeedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No listings found. Try adjusting your filters.
        </div>
      ) : viewMode === "map" ? (
        <DynamicFeedMap
          listings={listings}
          onListingClick={handleListingClick}
          height="calc(100vh - 200px)"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <FeedCard
                key={listing.id}
                listing={listing}
                currentUserId={user?.id ?? 0}
                onMessage={handleMessage}
                onClick={() => handleListingClick(listing)}
              />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchFeed(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchFeed(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
