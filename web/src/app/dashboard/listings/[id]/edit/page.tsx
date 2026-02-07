"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Listing } from "@/lib/types";
import ListingForm from "@/components/listings/ListingForm";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Listing not found");
          } else if (res.status === 403) {
            setError("You don't have permission to edit this listing");
          } else {
            setError("Failed to load listing");
          }
          return;
        }
        const data = await res.json();
        setListing(data.listing);
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || "Listing not found"}</p>
          <button
            onClick={() => router.push("/dashboard/listings")}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Listing #{listing.id}</h1>
      <ListingForm existing={listing} />
    </div>
  );
}
