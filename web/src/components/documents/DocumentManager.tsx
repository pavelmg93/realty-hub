"use client";

import { useState, useRef } from "react";
import { ListingDocument, StagedDocument, DocumentCategory } from "@/lib/types";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * DocumentManager supports two modes:
 * 1. **Registered mode** (listingId provided): uploads file to disk AND registers with listing in DB.
 * 2. **Staging mode** (no listingId): uploads file to disk only, stores metadata for later registration.
 */

interface RegisteredProps {
  listingId: number;
  documents: ListingDocument[];
  onDocumentsChange: (docs: ListingDocument[]) => void;
  readOnly?: boolean;
  stagedDocuments?: never;
  onStagedDocumentsChange?: never;
}

interface StagedProps {
  listingId?: undefined;
  stagedDocuments: StagedDocument[];
  onStagedDocumentsChange: (docs: StagedDocument[]) => void;
  readOnly?: boolean;
  documents?: never;
  onDocumentsChange?: never;
}

type Props = RegisteredProps | StagedProps;

export default function DocumentManager(props: Props) {
  const { readOnly = false } = props;
  const isStaging = props.listingId == null;

  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("other");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

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

        if (isStaging) {
          const staged: StagedDocument = {
            file_path: uploadData.file_path,
            file_name: file.name,
            original_name: uploadData.original_name,
            file_size: uploadData.file_size,
            mime_type: uploadData.mime_type,
            category: selectedCategory,
            notes: notes || null,
          };
          props.onStagedDocumentsChange([...props.stagedDocuments, staged]);
        } else {
          const docRes = await fetch(`/api/listings/${props.listingId}/documents`, {
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
            props.onDocumentsChange([...props.documents, document]);
          }
        }
      } catch {
        setError("Upload failed");
      }
    }

    setNotes("");
    setUploading(false);
  };

  const handleDelete = async (index: number) => {
    if (isStaging) {
      props.onStagedDocumentsChange(props.stagedDocuments.filter((_, i) => i !== index));
    } else {
      const doc = props.documents[index];
      try {
        const res = await fetch(
          `/api/listings/${props.listingId}/documents?docId=${doc.id}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          props.onDocumentsChange(props.documents.filter((d) => d.id !== doc.id));
        }
      } catch {
        setError("Delete failed");
      }
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPDF = (mime: string | null) => mime === "application/pdf";

  // Unified display list
  type DisplayDoc = {
    key: string;
    file_path: string;
    name: string;
    file_size: number | null;
    mime_type: string | null;
    category: string;
    notes: string | null;
    index: number;
  };

  const displayDocs: DisplayDoc[] = isStaging
    ? props.stagedDocuments.map((d, i) => ({
        key: `staged-${i}`,
        file_path: d.file_path,
        name: d.original_name || d.file_name,
        file_size: d.file_size,
        mime_type: d.mime_type,
        category: d.category,
        notes: d.notes,
        index: i,
      }))
    : props.documents.map((d, i) => ({
        key: `doc-${d.id}`,
        file_path: d.file_path,
        name: d.original_name || d.file_name,
        file_size: d.file_size,
        mime_type: d.mime_type,
        category: d.category,
        notes: d.notes,
        index: i,
      }));

  // Group by category
  const grouped = displayDocs.reduce(
    (acc, doc) => {
      const cat = doc.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    },
    {} as Record<string, DisplayDoc[]>,
  );

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

      {/* Document list grouped by category */}
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {DOCUMENT_CATEGORIES[category as DocumentCategory] || category}
          </h4>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.key}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] group"
                style={{ backgroundColor: "var(--bg-surface)" }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 opacity-90"
                  style={
                    isPDF(doc.mime_type)
                      ? { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "var(--error)" }
                      : { backgroundColor: "rgba(59, 130, 246, 0.2)", color: "var(--info)" }
                  }
                >
                  {isPDF(doc.mime_type) ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {doc.name}
                  </p>
                  <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                    {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                    {doc.notes && <span className="truncate">{doc.notes}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <a
                    href={`/api/files/${doc.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs rounded transition-colors border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  >
                    {t("view")}
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(doc.index)}
                      className="px-2 py-1 text-xs rounded transition-colors opacity-0 group-hover:opacity-100"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        color: "var(--error)",
                      }}
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

      {displayDocs.length === 0 && readOnly && (
        <p className="text-sm text-[var(--text-muted)] italic">No documents uploaded</p>
      )}

      {/* Upload form */}
      {!readOnly && (
        <div
          className="border rounded-xl p-4"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex gap-3 mb-3">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as DocumentCategory)
              }
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
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
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--orange)]"
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
            className="w-full px-4 py-3 text-sm rounded-lg border-2 border-dashed transition-colors disabled:opacity-50 hover:border-[var(--orange)] hover:text-[var(--text-primary)]"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {uploading ? (t("uploading")) : "Choose files to upload"}
          </button>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
            Images and PDFs accepted (max 20MB each)
          </p>
        </div>
      )}
    </div>
  );
}
