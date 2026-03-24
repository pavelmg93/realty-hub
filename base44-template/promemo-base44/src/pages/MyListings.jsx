import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ListingCard from "../components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("active");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.email],
    queryFn: () => base44.entities.Listing.filter({ agent_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const active = listings.filter(l => !l.is_archived);
  const archived = listings.filter(l => l.is_archived);
  const displayed = tab === "active" ? active : archived;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-1">{active.length} active, {archived.length} archived</p>
        </div>
        <Link to={createPageUrl("CreateListing")}>
          <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
            <Plus className="w-4 h-4" /> New Listing
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(4).fill(0).map((_, i) => (
            <div key={i}><Skeleton className="aspect-[4/3] w-full rounded-xl" /><div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{tab === "active" ? "🏗️" : "📦"}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">
            {tab === "active" ? "No active listings" : "No archived listings"}
          </h3>
          {tab === "active" && (
            <Link to={createPageUrl("CreateListing")}>
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700">Create your first listing</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayed.map(listing => (
            <ListingCard key={listing.id} listing={listing} showAgent={false} />
          ))}
        </div>
      )}
    </div>
  );
}