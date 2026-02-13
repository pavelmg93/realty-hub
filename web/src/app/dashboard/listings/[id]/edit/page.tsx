"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Listing, ListingPhoto, ListingDocument } from "@/lib/types";
import ListingForm from "@/components/listings/ListingForm";
import PhotoUploader from "@/components/photos/PhotoUploader";
import DocumentManager from "@/components/documents/DocumentManager";

type Tab = "edit" | "photos" | "documents";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [documents, setDocuments] = useState<ListingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  const listingId = parseInt(id, 10);

  useEffect(() => {
    async function fetchData() {
      try {
        const [listingRes, photosRes, docsRes] = await Promise.all([
          fetch(`/api/listings/${id}`, { cache: "no-store" }),
          fetch(`/api/listings/${id}/photos`),
          fetch(`/api/listings/${id}/documents`),
        ]);

        if (!listingRes.ok) {
          if (listingRes.status === 404) {
            setError("Listing not found");
          } else if (listingRes.status === 403) {
            setError("You don't have permission to edit this listing");
          } else {
            setError("Failed to load listing");
          }
          return;
        }
        const data = await listingRes.json();
        setListing(data.listing);

        if (photosRes.ok) {
          const pData = await photosRes.json();
          setPhotos(pData.photos);
        }
        if (docsRes.ok) {
          const dData = await docsRes.json();
          setDocuments(dData.documents);
        }
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Edit Listing #{listing.id}
        </h1>
        <button
          onClick={() => router.push(`/dashboard/listings/${listing.id}/view`)}
          className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          View
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {(
          [
            { key: "edit", label: "Listing Data" },
            { key: "photos", label: `Photos (${photos.length})` },
            { key: "documents", label: `Documents (${documents.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "edit" && <ListingForm existing={listing} />}

      {activeTab === "photos" && (
        <PhotoUploader
          listingId={listingId}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      )}

      {activeTab === "documents" && (
        <DocumentManager
          listingId={listingId}
          documents={documents}
          onDocumentsChange={setDocuments}
        />
      )}
    </div>
  );
}
