"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FeedFilterValues } from "./FeedFilters";

interface Person {
  id: string;
  full_name: string;
  type: "buyer" | "seller";
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  searchQuery: string;
  filters: FeedFilterValues;
}

export default function SaveSearchModal({ open, onClose, onSaved, searchQuery, filters }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [buyers, setBuyers] = useState<Person[]>([]);
  const [sellers, setSellers] = useState<Person[]>([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(new Set());
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonType, setNewPersonType] = useState<"buyer" | "seller">("buyer");
  const [saving, setSaving] = useState(false);
  const [showBuyers, setShowBuyers] = useState(false);
  const [showSellers, setShowSellers] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelectedPersonIds(new Set());
    setShowNewPerson(false);
    setNewPersonName("");

    Promise.all([
      fetch("/api/persons?type=buyer").then((r) => r.ok ? r.json() : { persons: [] }),
      fetch("/api/persons?type=seller").then((r) => r.ok ? r.json() : { persons: [] }),
    ]).then(([bData, sData]) => {
      setBuyers(bData.persons ?? []);
      setSellers(sData.persons ?? []);
    });
  }, [open]);

  const togglePerson = (id: string) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) return;
    const res = await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newPersonType, full_name: newPersonName.trim(), status: "lead" }),
    });
    if (res.ok) {
      const data = await res.json();
      const person = data.person;
      if (newPersonType === "buyer") {
        setBuyers((prev) => [...prev, person]);
      } else {
        setSellers((prev) => [...prev, person]);
      }
      setSelectedPersonIds((prev) => new Set(prev).add(person.id));
      setNewPersonName("");
      setShowNewPerson(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const filtersToSave: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v && k !== "sort" && k !== "order") {
        filtersToSave[k] = v;
      }
    }
    if (filters.sort !== "created_at") filtersToSave.sort = filters.sort;
    if (filters.order !== "desc") filtersToSave.order = filters.order;

    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          query: searchQuery || "",
          filters: filtersToSave,
          person_ids: Array.from(selectedPersonIds),
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-[90vw] max-w-md max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--border)] p-5"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("saveSearch")}</h2>
          <button type="button" onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        {/* Search name */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--text-secondary)] mb-1">{t("searchName")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={searchQuery || t("saveSearch")}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
            autoFocus
          />
        </div>

        {/* Summary of what's being saved */}
        <div className="mb-4 p-3 rounded-lg text-xs text-[var(--text-muted)]" style={{ backgroundColor: "var(--bg-elevated)" }}>
          {searchQuery && <div>{t("search")}: &quot;{searchQuery}&quot;</div>}
          {Object.entries(filters).filter(([k, v]) => v && k !== "sort" && k !== "order").length > 0 && (
            <div>{t("filters")}: {Object.entries(filters).filter(([k, v]) => v && k !== "sort" && k !== "order").length} {t("active").toLowerCase()}</div>
          )}
          {!searchQuery && Object.entries(filters).filter(([k, v]) => v && k !== "sort" && k !== "order").length === 0 && (
            <div>{t("noResults")} — {t("all")} {t("listings")}</div>
          )}
        </div>

        {/* Buyers checklist */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowBuyers(!showBuyers)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-1"
          >
            <span className={`transform transition-transform ${showBuyers ? "rotate-90" : ""}`}>▶</span>
            {t("buyers")} ({buyers.length})
          </button>
          {showBuyers && (
            <div className="ml-4 space-y-1 max-h-32 overflow-y-auto">
              {buyers.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={selectedPersonIds.has(p.id)}
                    onChange={() => togglePerson(p.id)}
                    className="rounded accent-[var(--orange)]"
                  />
                  {p.full_name}
                </label>
              ))}
              {buyers.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">{t("noResults")}</p>
              )}
            </div>
          )}
        </div>

        {/* Sellers checklist */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowSellers(!showSellers)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-1"
          >
            <span className={`transform transition-transform ${showSellers ? "rotate-90" : ""}`}>▶</span>
            {t("sellers")} ({sellers.length})
          </button>
          {showSellers && (
            <div className="ml-4 space-y-1 max-h-32 overflow-y-auto">
              {sellers.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={selectedPersonIds.has(p.id)}
                    onChange={() => togglePerson(p.id)}
                    className="rounded accent-[var(--orange)]"
                  />
                  {p.full_name}
                </label>
              ))}
              {sellers.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">{t("noResults")}</p>
              )}
            </div>
          )}
        </div>

        {/* Quick-create person */}
        {showNewPerson ? (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder={t("fullName")}
              className="flex-1 min-w-[120px] px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            />
            <select
              value={newPersonType}
              onChange={(e) => setNewPersonType(e.target.value as "buyer" | "seller")}
              className="px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            >
              <option value="buyer">{t("buyer")}</option>
              <option value="seller">{t("seller")}</option>
            </select>
            <button
              type="button"
              onClick={handleCreatePerson}
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: "var(--orange)" }}
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setShowNewPerson(false); setNewPersonName(""); }}
              className="p-1.5 text-[var(--text-muted)]"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewPerson(true)}
            className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[var(--orange)] hover:underline"
          >
            <Plus size={14} /> {t("newPerson")}
          </button>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: "var(--orange)" }}
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
