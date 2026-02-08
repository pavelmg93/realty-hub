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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

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

  const fetchFeed = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
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
    [filters],
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

  const handleApplyFilters = () => {
    fetchFeed(1);
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Feed</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
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
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No listings found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">
            {pagination.total} listing{pagination.total !== 1 ? "s" : ""} found
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <FeedCard
                key={listing.id}
                listing={listing}
                currentUserId={user?.id ?? 0}
                onMessage={handleMessage}
              />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchFeed(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchFeed(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
