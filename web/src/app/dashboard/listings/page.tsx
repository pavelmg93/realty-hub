"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import ListingCard from "@/components/listings/ListingCard";
import { GridToggle } from "@/components/ui/GridToggle";
import FeedFilters, {
  FeedFilterValues,
  DEFAULT_FILTERS,
} from "@/components/feed/FeedFilters";
import DynamicFeedMap from "@/components/map/DynamicFeedMap";
import { useLanguage } from "@/contexts/LanguageContext";
import { LAYOUT } from "@/lib/layout-constants";
import { Plus, Filter, Map, Search } from "lucide-react";

type ViewMode = "grid" | "map";
type GridCols = 1 | 2;

export default function ListingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedFilterValues>({ ...DEFAULT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cols, setCols] = useState<GridCols>(2);
  const [searchQuery, setSearchQuery] = useState("");
  const restoreScrollRef = useRef<number | null>(null);

  // Restore view mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realtyhub_listings_view_mode");
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
      localStorage.setItem("realtyhub_listings_view_mode", JSON.stringify({ viewMode, cols }));
    } catch {}
  }, [viewMode, cols]);

  // Read saved scroll on mount — apply after data loads
  useEffect(() => {
    try {
      const savedY = sessionStorage.getItem("realtyhub_scroll_listings");
      if (savedY) {
        sessionStorage.removeItem("realtyhub_scroll_listings");
        restoreScrollRef.current = parseInt(savedY, 10);
      }
    } catch {}
  }, []);

  const fetchListings = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("archived", "false");

      const query = q !== undefined ? q : searchQuery;
      if (query.trim()) params.set("q", query.trim());

      params.set("sort", filters.sort);
      params.set("order", filters.order);
      for (const [key, value] of Object.entries(filters)) {
        if (value && key !== "sort" && key !== "order") {
          params.set(key, value);
        }
      }
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Apply saved scroll position after data finishes loading
  useEffect(() => {
    if (!loading && restoreScrollRef.current !== null) {
      const y = restoreScrollRef.current;
      restoreScrollRef.current = null;
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "instant" });
      });
    }
  }, [loading]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    fetchListings(value);
  };

  const handleApplyFilters = () => fetchListings();
  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });

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

  return (
    <div className={`px-4 sm:px-6 max-w-3xl mx-auto${viewMode === "grid" ? " py-4" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("myListings")}
        </h1>
        <Link
          href="/dashboard/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: "var(--orange)" }}
        >
          <Plus size={16} /> {t("addListing")}
        </Link>
      </div>

      {/* Unified toolbar — h-12 (48px) in map mode */}
      <div className={`flex items-center gap-2 ${viewMode === "map" ? "h-12" : "mb-3"}`}>
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--orange)]"
            placeholder={t("searchListings") || "Tìm kiếm địa chỉ, phường, mô tả..."}
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
          onClick={() => setShowFilters((s) => !s)}
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
          onClick={() => setViewMode((m) => (m === "grid" ? "map" : "grid"))}
          className="inline-flex flex-none items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <Map size={16} /> {viewMode === "map" ? t("grid") : t("map")}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <FeedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      {loading ? (
        <div className={`grid gap-4 ${cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-3">
            {t("noListings")}
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/listings/new")}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {t("addListing")}
          </button>
        </div>
      ) : viewMode === "map" ? (
        <div className="overflow-hidden">
          <DynamicFeedMap
            listings={listings}
            onListingClick={(l) => {
              try {
                sessionStorage.setItem("realtyhub_scroll_listings", String(window.scrollY));
              } catch {}
              router.push(`/dashboard/listings/${l.id}/view?from=listings`);
            }}
            height={LAYOUT.MAP_HEIGHT}
          />
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            cols === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isArchived={false}
              isOwner
              cols={cols}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
              onBeforeNavigate={() => {
                try {
                  sessionStorage.setItem("realtyhub_scroll_listings", String(window.scrollY));
                } catch {}
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
