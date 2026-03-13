"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/constants";
import { Star, MessageCircle } from "lucide-react";

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [agent, setAgent] = useState<{
    id: number;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    listing_count: number;
    is_favorited: boolean;
  } | null>(null);
  const [listings, setListings] = useState<Array<{
    id: number;
    ward: string | null;
    street: string | null;
    price_vnd: number | null;
    property_type: string | null;
    area_m2: number | null;
    status: string;
    primary_photo: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Agent not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        setAgent(data.agent);
        setListings(data.listings ?? []);
      } catch {
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [id]);

  const toggleFavorite = async () => {
    if (!agent) return;
    const res = await fetch("/api/crm/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited_agent_id: agent.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setAgent((a) => (a ? { ...a, is_favorited: data.favorited } : null));
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto text-center py-12 text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }
  if (error || !agent) {
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

  const displayName = agent.first_name || agent.username || agent.name || "Agent";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isOwn = user?.id === agent.id;

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
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Agent Profile</h1>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-[var(--border)] mb-6"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div
          className="h-20 w-full"
          style={{
            background: "linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(44, 58, 80, 0.9) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center -mt-10 px-6 pb-6">
          {agent.avatar_url ? (
            <img
              src={`/api/files/${agent.avatar_url}`}
              alt=""
              className="w-20 h-20 rounded-full border-4 object-cover shrink-0"
              style={{ borderColor: "var(--bg-surface)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0 font-bold text-white text-xl"
              style={{ borderColor: "var(--bg-surface)", backgroundColor: "var(--orange)" }}
            >
              {initials}
            </div>
          )}
          <h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">{displayName}</h2>
          {agent.username && (
            <p className="text-sm text-[var(--text-muted)]">@{agent.username}</p>
          )}
          <p className="text-sm text-[var(--orange)] font-medium mt-1">
            {agent.listing_count} listing{agent.listing_count !== 1 ? "s" : ""}
          </p>
          <div className="mt-4 flex gap-3 w-full">
            {!isOwn && (
              <Link
                href={`/dashboard/messages/new?agent_id=${agent.id}`}
                className="flex-1 py-2 px-4 text-white text-sm font-medium rounded-lg text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--orange)" }}
              >
                <MessageCircle size={16} className="inline mr-1.5" />
                Message
              </Link>
            )}
            {!isOwn && (
              <button
                type="button"
                onClick={toggleFavorite}
                className={`py-2 px-4 rounded-lg border transition-colors ${
                  agent.is_favorited
                    ? "text-[var(--orange)] border-[var(--orange)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--orange)]"
                }`}
              >
                <Star size={18} className={agent.is_favorited ? "fill-current" : ""} />
              </button>
            )}
          </div>
        </div>
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
          {agent.phone && (
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Phone:</span> {agent.phone}
            </p>
          )}
          {agent.email && (
            <p className="text-sm text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Email:</span> {agent.email}
            </p>
          )}
          {!agent.phone && !agent.email && (
            <p className="text-sm text-[var(--text-muted)]">{t("noContactInfo")}</p>
          )}
        </div>
      </section>

      {/* Listings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
          {t("myListings")} ({listings.length})
        </h3>
        <div className="space-y-2">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/dashboard/listings/${listing.id}/view?from=feed`}
              className="flex gap-3 p-3 rounded-xl border border-[var(--border)] transition-colors hover:border-[var(--orange)]/50"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              {listing.primary_photo ? (
                <img
                  src={`/api/files/${listing.primary_photo}`}
                  alt=""
                  className="w-16 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-12 rounded-lg shrink-0 flex items-center justify-center text-[var(--text-muted)] text-xs"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  {t("noPhoto")}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {listing.ward || listing.street || `#${listing.id}`}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {listing.price_vnd != null ? formatPrice(listing.price_vnd) : "—"}
                  {listing.area_m2 != null ? ` · ${listing.area_m2}m²` : ""}
                </p>
              </div>
            </Link>
          ))}
          {listings.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              {t("noListings")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
