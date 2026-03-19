"use client";

import { useState, useRef } from "react";
import { ListingPhoto, StagedPhoto } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

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

function clientValidate(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `${file.name}: file too large (max 10MB)`;
  const mime = file.type.toLowerCase();
  const isAllowed = ALLOWED_TYPES.includes(mime) ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");
  if (!isAllowed) return `${file.name}: unsupported type (JPEG, PNG, WebP, HEIC only)`;
  return null;
}

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
      const validationError = clientValidate(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

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
          const staged: StagedPhoto = {
            file_path: uploadData.file_path,
            thumb_path: uploadData.thumb_path || null,
            original_name: uploadData.original_name,
            file_size: uploadData.file_size,
          };
          props.onStagedPhotosChange([...props.stagedPhotos, staged]);
        } else {
          const photoRes = await fetch(`/api/listings/${props.listingId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_path: uploadData.file_path,
              thumb_path: uploadData.thumb_path || null,
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
      props.onStagedPhotosChange(props.stagedPhotos.filter((_, i) => i !== index));
    } else {
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

  const handleSetPrimary = async (photoId: number) => {
    if (isStaging) return; // primary = first in staging mode
    try {
      const res = await fetch(`/api/listings/${props.listingId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        const { photos } = await res.json();
        props.onPhotosChange(photos);
      }
    } catch {
      setError("Failed to set primary photo");
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
        src: `/api/files/${p.thumb_path || p.file_path}`,
        alt: p.original_name || `Photo ${i + 1}`,
        index: i,
        isPrimary: i === 0,
        id: null as null,
      }))
    : props.photos.map((p, i) => ({
        key: `photo-${p.id}`,
        src: `/api/files/${p.thumb_path || p.file_path}`,
        alt: p.original_name || `Photo ${i + 1}`,
        index: i,
        isPrimary: p.is_primary,
        id: p.id,
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
              {/* Primary badge */}
              {photo.isPrimary && (
                <span
                  className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: "var(--orange)" }}
                >
                  ★
                </span>
              )}
              {/* Star button to set as primary (registered mode, non-primary photos, not readOnly) */}
              {!readOnly && !isStaging && !photo.isPrimary && photo.id !== null && (
                <button
                  onClick={() => handleSetPrimary(photo.id!)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  title="Set as primary photo"
                >
                  ☆
                </button>
              )}
              {/* Delete button */}
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
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
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
            <p className="text-sm text-[var(--text-muted)]">{t("uploading")}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {t("clickOrDragPhotos")}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                JPEG, PNG, WebP, HEIC (max 10MB)
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
