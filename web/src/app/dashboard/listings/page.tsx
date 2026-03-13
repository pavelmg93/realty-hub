"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Filter, Map } from "lucide-react";

type Tab = "active" | "archived";
type ViewMode = "grid" | "map";
type GridCols = 1 | 2 | 3;

export default function ListingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedFilterValues>({ ...DEFAULT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cols, setCols] = useState<GridCols>(2);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("archived", tab === "archived" ? "true" : "false");
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
  }, [tab, filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleApplyFilters = () => fetchListings();
  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const handleArchive = async (id: number) => {
    const res = await fetch(`/api/listings/${id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: true }),
    });
    if (res.ok) fetchListings();
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

  return (
    <div className="p-3">
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "active"
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={tab === "active" ? { backgroundColor: "var(--orange)" } : { backgroundColor: "var(--bg-surface)" }}
          >
            {t("active")}
          </button>
          <button
            type="button"
            onClick={() => setTab("archived")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "archived"
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={tab === "archived" ? { backgroundColor: "var(--orange)" } : { backgroundColor: "var(--bg-surface)" }}
          >
            {t("archived")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--border)] ${
            showFilters ? "text-white" : "text-[var(--text-secondary)]"
          }`}
          style={showFilters ? { backgroundColor: "var(--orange)" } : { backgroundColor: "var(--bg-surface)" }}
        >
          <Filter size={16} /> {t("filters")}
        </button>

        {viewMode === "grid" && (
          <GridToggle value={cols} onChange={setCols} />
        )}

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === "grid" ? "map" : "grid"))}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <Map size={16} /> {viewMode === "map" ? t("grid") : t("map")}
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
        <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          {tab === "active" ? t("noActiveListings") : t("noArchivedListings")}
        </div>
      ) : viewMode === "map" ? (
        <DynamicFeedMap
          listings={listings}
          onListingClick={(l) => router.push(`/dashboard/listings/${l.id}/view?from=listings`)}
          height="calc(100vh - 260px)"
        />
      ) : (
        <div
          className={`grid gap-4 ${
            cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isArchived={tab === "archived"}
              isOwner
              onArchive={handleArchive}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
