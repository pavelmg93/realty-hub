import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ListingCard from "../components/listings/ListingCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("listings");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: favListings = [] } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: () => base44.entities.FavoriteListing.filter({ agent_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["all-listings"],
    queryFn: () => base44.entities.Listing.list("-created_date", 200),
  });

  const { data: favAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["fav-agents", user?.email],
    queryFn: () => base44.entities.FavoriteAgent.filter({ agent_email: user.email }),
    enabled: !!user?.email,
  });

  const favIds = new Set(favListings.map(f => f.listing_id));
  const favListingItems = allListings.filter(l => favIds.has(l.id));

  const removeFav = useMutation({
    mutationFn: async (listingId) => {
      const fav = favListings.find(f => f.listing_id === listingId);
      if (fav) await base44.entities.FavoriteListing.delete(fav.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const removeFavAgent = useMutation({
    mutationFn: (id) => base44.entities.FavoriteAgent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fav-agents"] }),
  });

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="listings" className="gap-2"><Heart className="w-4 h-4" /> Listings ({favListingItems.length})</TabsTrigger>
          <TabsTrigger value="agents" className="gap-2"><Users className="w-4 h-4" /> Agents ({favAgents.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "listings" && (
        loadingListings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)}
          </div>
        ) : favListingItems.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No favorite listings yet</h3>
            <p className="text-sm text-gray-500 mt-1">Heart listings from the feed to save them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favListingItems.map(l => (
              <ListingCard key={l.id} listing={l} isFavorited onToggleFavorite={(id) => removeFav.mutate(id)} />
            ))}
          </div>
        )
      )}

      {tab === "agents" && (
        loadingAgents ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : favAgents.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No favorite agents yet</h3>
            <p className="text-sm text-gray-500 mt-1">Star agents from the Agents page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favAgents.map(fa => (
              <div key={fa.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                    {fa.favorited_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{fa.favorited_name}</p>
                    <p className="text-xs text-gray-500">{fa.favorited_email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFavAgent.mutate(fa.id)}>
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}