"use client";

import { useState, useRef } from "react";
import { ListingPhoto, StagedPhoto } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * PhotoUploader supports two modes:
 * 1. **Registered mode** (listingId provided): uploads file to disk AND registers with listing in DB.
 * 2. **Staging mode** (no listingId): uploads file to disk only, stores metadata for later registration.
 */

interface RegisteredProps {
  listingId: number;
  photos: ListingPhoto[];
  onPhotosChange: (photos: ListingPhoto[]) => void;
  readOnly?: boolean;
  stagedPhotos?: never;
  onStagedPhotosChange?: never;
}

interface StagedProps {
  listingId?: undefined;
  stagedPhotos: StagedPhoto[];
  onStagedPhotosChange: (photos: StagedPhoto[]) => void;
  readOnly?: boolean;
  photos?: never;
  onPhotosChange?: never;
}

type Props = RegisteredProps | StagedProps;

export default function PhotoUploader(props: Props) {
  const { readOnly = false } = props;
  const isStaging = props.listingId == null;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
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

        if (isStaging) {
          // Staging mode: just keep metadata
          const staged: StagedPhoto = {
            file_path: uploadData.file_path,
            original_name: uploadData.original_name,
            file_size: uploadData.file_size,
          };
          props.onStagedPhotosChange([...props.stagedPhotos, staged]);
        } else {
          // Registered mode: also register with listing in DB
          const photoRes = await fetch(`/api/listings/${props.listingId}/photos`, {
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
            props.onPhotosChange([...props.photos, photo]);
          }
        }
      } catch {
        setError("Upload failed");
      }
    }

    setUploading(false);
  };

  const handleDelete = async (index: number) => {
    if (isStaging) {
      // Staging mode: just remove from array
      props.onStagedPhotosChange(props.stagedPhotos.filter((_, i) => i !== index));
    } else {
      // Registered mode: delete from DB
      const photo = props.photos[index];
      try {
        const res = await fetch(
          `/api/listings/${props.listingId}/photos?photoId=${photo.id}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          props.onPhotosChange(props.photos.filter((p) => p.id !== photo.id));
        }
      } catch {
        setError("Delete failed");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Unified photo list for rendering
  const displayPhotos = isStaging
    ? props.stagedPhotos.map((p, i) => ({
        key: `staged-${i}`,
        src: `/api/files/${p.file_path}`,
        alt: p.original_name || `Photo ${i + 1}`,
        index: i,
      }))
    : props.photos.map((p, i) => ({
        key: `photo-${p.id}`,
        src: `/api/files/${p.file_path}`,
        alt: p.original_name || `Photo ${i + 1}`,
        index: i,
      }));

  return (
    <div>
      {error && (
        <div
          className="mb-3 p-2 text-sm rounded-lg border"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--error)",
            borderColor: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Photo grid */}
      {displayPhotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {displayPhotos.map((photo) => (
            <div
              key={photo.key}
              className="relative group aspect-square rounded-lg overflow-hidden"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
              {photo.index === 0 && (
                <span
                  className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: "var(--orange)" }}
                >
                  Primary
                </span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleDelete(photo.index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: "var(--error)" }}
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
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--orange)]"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-surface)",
          }}
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
            className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]"
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
            <p className="text-sm text-[var(--text-muted)]">{t("uploading") || "Uploading..."}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {t("clickOrDragPhotos") || "Click or drag photos here"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                JPEG, PNG, WebP, GIF (max 20MB)
              </p>
            </>
          )}
        </div>
      )}

      {displayPhotos.length === 0 && readOnly && (
        <p className="text-sm text-[var(--text-muted)] italic">{t("noPhoto")}</p>
      )}
    </div>
  );
}
