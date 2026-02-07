"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Listing } from "@/lib/types";
import ListingCard from "@/components/listings/ListingCard";

type Tab = "active" | "archived";
type SortField = "created_at" | "updated_at";
type SortOrder = "asc" | "desc";

export default function ListingsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const archived = tab === "archived" ? "true" : "false";
      const res = await fetch(
        `/api/listings?archived=${archived}&sort=${sortField}&order=${sortOrder}`,
      );
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, sortField, sortOrder]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link
          href="/dashboard/listings/new"
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          + Add New
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "active"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "archived"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Archived
          </button>
        </div>

        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("-") as [
              SortField,
              SortOrder,
            ];
            setSortField(field);
            setSortOrder(order);
          }}
          className="text-sm border rounded-lg px-3 py-2 bg-white"
        >
          <option value="updated_at-desc">Recently Updated</option>
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {tab === "active"
            ? "No active listings. Create your first one!"
            : "No archived listings."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isArchived={tab === "archived"}
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
