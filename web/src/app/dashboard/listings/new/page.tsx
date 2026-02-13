"use client";

import ListingForm from "@/components/listings/ListingForm";

export default function NewListingPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add New Listing</h1>
      <ListingForm />
    </div>
  );
}
