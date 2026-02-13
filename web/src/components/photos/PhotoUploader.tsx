"use client";

import { useState, useRef } from "react";
import { ListingPhoto } from "@/lib/types";

interface Props {
  listingId: number;
  photos: ListingPhoto[];
  onPhotosChange: (photos: ListingPhoto[]) => void;
  readOnly?: boolean;
}

export default function PhotoUploader({
  listingId,
  photos,
  onPhotosChange,
  readOnly = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    const newPhotos: ListingPhoto[] = [];

    for (const file of Array.from(files)) {
      try {
        // Upload file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "photo");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(data.error || "Upload failed");
          continue;
        }

        const uploadData = await uploadRes.json();

        // Register photo with listing
        const photoRes = await fetch(`/api/listings/${listingId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: uploadData.file_path,
            original_name: uploadData.original_name,
            file_size: uploadData.file_size,
          }),
        });

        if (photoRes.ok) {
          const { photo } = await photoRes.json();
          newPhotos.push(photo);
        }
      } catch {
        setError("Upload failed");
      }
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
    }
    setUploading(false);
  };

  const handleDelete = async (photoId: number) => {
    try {
      const res = await fetch(
        `/api/listings/${listingId}/photos?photoId=${photoId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onPhotosChange(photos.filter((p) => p.id !== photoId));
      }
    } catch {
      setError("Delete failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden"
            >
              <img
                src={`/api/files/${photo.file_path}`}
                alt={photo.original_name || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-2 left-2 text-xs px-2 py-0.5 bg-accent text-white rounded-full font-medium">
                  Primary
                </span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <svg
            className="w-10 h-10 mx-auto mb-3 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {uploading ? (
            <p className="text-sm text-slate-500">Uploading...</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600">
                Click or drag photos here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                JPEG, PNG, WebP, GIF (max 20MB each)
              </p>
            </>
          )}
        </div>
      )}

      {photos.length === 0 && readOnly && (
        <p className="text-sm text-slate-400 italic">No photos uploaded</p>
      )}
    </div>
  );
}
