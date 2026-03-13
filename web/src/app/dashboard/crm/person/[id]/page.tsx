"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DEAL_STAGES, formatPrice } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface Person {
  id: string;
  type: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  zalo: string | null;
  notes: string | null;
  status: string;
}

interface PersonListing {
  id: string;
  listing_id: number;
  role: string;
  rating: number | null;
  listing_ward: string | null;
  listing_price_vnd: number | null;
}

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [person, setPerson] = useState<Person | null>(null);
  const [listings, setListings] = useState<PersonListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [personRes, plRes, dealsRes] = await Promise.all([
          fetch(`/api/persons/${id}`),
          fetch(`/api/person-listings?person_id=${encodeURIComponent(id!)}`),
          fetch("/api/deals"),
        ]);
        if (!personRes.ok) {
          setError(personRes.status === 404 ? "Person not found" : "Failed to load");
          return;
        }
        const personData = await personRes.json();
        setPerson(personData.person);
        const plList: PersonListing[] = plRes.ok ? (await plRes.json()).person_listings ?? [] : [];
        const plListingIds = new Set(plList.map((pl) => pl.listing_id));
        const dealsList = dealsRes.ok ? (await dealsRes.json()).deals ?? [] : [];
        const fromDeals: PersonListing[] = dealsList
          .filter(
            (d: { listing_id: number | null; buyer_person_id: string | null; seller_person_id: string | null }) =>
              d.listing_id != null &&
              (d.buyer_person_id === id || d.seller_person_id === id) &&
              !plListingIds.has(d.listing_id)
          )
          .map((d: { id: string; listing_id: number; listing_ward: string | null; listing_price_vnd: number | null }) => ({
            id: `deal-${d.id}`,
            listing_id: d.listing_id,
            role: "buyer_interest",
            rating: null,
            listing_ward: d.listing_ward,
            listing_price_vnd: d.listing_price_vnd,
          }));
        setListings([...plList, ...fromDeals]);
      } catch {
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto text-center py-12 text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }
  if (error || !person) {
    return (
      <div className="p-4 max-w-md mx-auto text-center py-12">
        <p className="text-[var(--error)] mb-4">{error || "Not found"}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/crm")}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Back to CRM
        </button>
      </div>
    );
  }

  const isSeller = person.type === "seller";

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {isSeller ? "Seller" : "Buyer"} Profile
        </h1>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-[var(--border)] mb-6 p-6"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl mb-3"
          style={{ backgroundColor: "var(--orange)" }}
        >
          {(person.full_name || "?").slice(0, 2).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{person.full_name}</h2>
        <span
          className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "rgba(232, 119, 34, 0.15)",
            color: "var(--orange)",
          }}
        >
          {DEAL_STAGES[person.status] || person.status}
        </span>
      </div>

      {/* Contact */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
          Contact
        </h3>
        <div
          className="rounded-xl border border-[var(--border)] p-4 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {person.phone && (
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Phone:</span> {person.phone}
            </p>
          )}
          {person.email && (
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Email:</span> {person.email}
            </p>
          )}
          {person.zalo && (
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Zalo:</span> {person.zalo}
            </p>
          )}
          {person.notes && (
            <p className="text-sm text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
              {person.notes}
            </p>
          )}
          {!person.phone && !person.email && !person.zalo && !person.notes && (
            <p className="text-sm text-[var(--text-muted)]">No contact info</p>
          )}
        </div>
      </section>

      {/* Associated Listings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
          {t("associatedListings")} ({listings.length})
        </h3>
        <div className="space-y-2">
          {listings.map((pl) => (
            <Link
              key={pl.id}
              href={`/dashboard/listings/${pl.listing_id}/view?from=listings`}
              className="flex justify-between items-center gap-3 p-3 rounded-xl border border-[var(--border)] transition-colors hover:border-[var(--orange)]/50"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  #{pl.listing_id} {pl.listing_ward && `· ${pl.listing_ward}`}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {pl.listing_price_vnd != null ? formatPrice(pl.listing_price_vnd) : "—"}
                </p>
              </div>
              {!isSeller && pl.rating != null && (
                <span className="text-xs text-[var(--orange)] shrink-0">
                  {pl.rating} ★
                </span>
              )}
            </Link>
          ))}
          {listings.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              {t("noAssociatedListings")}
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/dashboard/crm?tab=deals&${isSeller ? "seller" : "buyer"}_id=${person.id}`}
          className="flex-1 py-2 text-center text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: "var(--orange)" }}
        >
          Create deal
        </Link>
      </div>
    </div>
  );
}
