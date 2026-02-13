"use client";

import { useState, useRef } from "react";
import { ListingDocument, DocumentCategory } from "@/lib/types";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";

interface Props {
  listingId: number;
  documents: ListingDocument[];
  onDocumentsChange: (docs: ListingDocument[]) => void;
  readOnly?: boolean;
}

export default function DocumentManager({
  listingId,
  documents,
  onDocumentsChange,
  readOnly = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("other");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    const newDocs: ListingDocument[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "document");

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

        const docRes = await fetch(`/api/listings/${listingId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: uploadData.file_path,
            file_name: file.name,
            original_name: uploadData.original_name,
            file_size: uploadData.file_size,
            mime_type: uploadData.mime_type,
            category: selectedCategory,
            notes: notes || null,
          }),
        });

        if (docRes.ok) {
          const { document } = await docRes.json();
          newDocs.push(document);
        }
      } catch {
        setError("Upload failed");
      }
    }

    if (newDocs.length > 0) {
      onDocumentsChange([...documents, ...newDocs]);
    }
    setNotes("");
    setUploading(false);
  };

  const handleDelete = async (docId: number) => {
    try {
      const res = await fetch(
        `/api/listings/${listingId}/documents?docId=${docId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onDocumentsChange(documents.filter((d) => d.id !== docId));
      }
    } catch {
      setError("Delete failed");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPDF = (mime: string | null) => mime === "application/pdf";

  // Group by category
  const grouped = documents.reduce(
    (acc, doc) => {
      const cat = doc.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    },
    {} as Record<string, ListingDocument[]>,
  );

  return (
    <div>
      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Document list grouped by category */}
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            {DOCUMENT_CATEGORIES[category as DocumentCategory] || category}
          </h4>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg group"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isPDF(doc.mime_type)
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {isPDF(doc.mime_type) ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {doc.original_name || doc.file_name}
                  </p>
                  <div className="flex gap-2 text-xs text-slate-400">
                    {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                    {doc.notes && (
                      <span className="truncate">{doc.notes}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <a
                    href={`/api/files/${doc.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  >
                    View
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {documents.length === 0 && readOnly && (
        <p className="text-sm text-slate-400 italic">No documents uploaded</p>
      )}

      {/* Upload form */}
      {!readOnly && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex gap-3 mb-3">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as DocumentCategory)
              }
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            >
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-2 text-sm border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-accent/50 hover:bg-accent/5 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose files to upload"}
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Images and PDFs accepted (max 20MB each)
          </p>
        </div>
      )}
    </div>
  );
}
