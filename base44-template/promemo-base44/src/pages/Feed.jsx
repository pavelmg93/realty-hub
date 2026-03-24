import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ListingCard from "../components/listings/ListingCard";
import ListingFilters from "../components/listings/ListingFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("-created_date");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allListings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: () => base44.entities.Listing.list("-created_date", 200),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: () => base44.entities.FavoriteListing.filter({ agent_email: user.email }),
    enabled: !!user?.email,
  });

  const favIds = new Set(favorites.map(f => f.listing_id));

  const toggleFav = useMutation({
    mutationFn: async (listingId) => {
      const existing = favorites.find(f => f.listing_id === listingId);
      if (existing) {
        await base44.entities.FavoriteListing.delete(existing.id);
      } else {
        await base44.entities.FavoriteListing.create({
          listing_id: listingId,
          agent_email: user.email,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const filteredListings = useMemo(() => {
    let items = allListings.filter(l => !l.is_archived);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q) ||
        l.district?.toLowerCase().includes(q) ||
        l.agent_name?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }
    if (filters.property_type) items = items.filter(l => l.property_type === filters.property_type);
    if (filters.transaction_status) items = items.filter(l => l.transaction_status === filters.transaction_status);
    if (filters.district) items = items.filter(l => l.district === filters.district);
    if (filters.direction) items = items.filter(l => l.direction === filters.direction);
    if (filters.legal_status) items = items.filter(l => l.legal_status === filters.legal_status);
    if (filters.furnishing) items = items.filter(l => l.furnishing === filters.furnishing);
    if (filters.minPrice) items = items.filter(l => (l.price || 0) >= filters.minPrice);
    if (filters.maxPrice) items = items.filter(l => (l.price || 0) <= filters.maxPrice);
    if (filters.minBedrooms) items = items.filter(l => (l.bedrooms || 0) >= filters.minBedrooms);
    if (filters.minArea) items = items.filter(l => (l.area_sqm || 0) >= filters.minArea);

    // Sort
    const [dir, key] = sortBy.startsWith("-") ? [-1, sortBy.slice(1)] : [1, sortBy];
    items.sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return items;
  }, [allListings, filters, sortBy]);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listings Feed</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filteredListings.length} active listing{filteredListings.length !== 1 ? "s" : ""} in Nha Trang
        </p>
      </div>

      <ListingFilters filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No listings found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={favIds.has(listing.id)}
              onToggleFavorite={(id) => toggleFav.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}