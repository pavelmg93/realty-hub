import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import ListingForm from "../components/listings/ListingForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditListing() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const navigate = useNavigate();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const items = await base44.entities.Listing.filter({ id });
      return items[0];
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.update(id, data),
    onSuccess: () => navigate(createPageUrl(`ListingDetail?id=${id}`)),
  });

  if (isLoading) return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-gray-500 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Listing</h1>
        {listing && (
          <ListingForm
            initial={listing}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => navigate(-1)}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}