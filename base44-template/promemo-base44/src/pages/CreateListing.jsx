import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useMutation } from "@tanstack/react-query";
import ListingForm from "../components/listings/ListingForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateListing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.create({
      ...data,
      agent_name: user?.full_name || "Agent",
      agent_email: user?.email,
    }),
    onSuccess: () => navigate(createPageUrl("MyListings")),
  });

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-gray-500 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Create New Listing</h1>
        <ListingForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => navigate(-1)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}