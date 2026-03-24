"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus, Building2, TrendingUp, Plus, X } from "lucide-react";
import { DEAL_STAGES, formatPrice } from "@/lib/constants";
import { getPropertyTypeKey } from "@/lib/i18n";

type Tab = "agents" | "sellers" | "buyers" | "deals";

interface AgentRow {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  email: string | null;
  name: string | null;
}

interface PersonRow {
  id: string;
  type: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  zalo: string | null;
  notes: string | null;
  status: string;
  buyer_criteria?: unknown;
  created_at: string;
  updated_at: string;
}

interface DealRow {
  id: string;
  listing_id: number | null;
  buyer_person_id: string | null;
  seller_person_id: string | null;
  stage: string;
  stage_updated_at: string;
  value_vnd: number | null;
  notes: string | null;
  buyer_name: string | null;
  seller_name: string | null;
  listing_ward: string | null;
  listing_property_type: string | null;
  listing_price_vnd: number | null;
}

interface PersonListingRow {
  id: string;
  person_id: string;
  listing_id: number;
  role: string;
  rating: number | null;
  notes: string | null;
  listing_ward: string | null;
  listing_property_type: string | null;
  listing_price_vnd: number | null;
}

const STAGE_ORDER = [
  "lead",
  "engaged",
  "considering",
  "viewing",
  "negotiating",
  "closing",
  "won",
  "lost",
];

function DealsBoard({
  deals,
  buyers,
  sellers,
  formatPrice,
  t,
  onDealStage,
  onPersonStage,
}: {
  deals: DealRow[];
  buyers: PersonRow[];
  sellers: PersonRow[];
  formatPrice: (vnd: number | null) => string;
  t: (key: string) => string;
  onDealStage: (dealId: string, stage: string) => void;
  onPersonStage: (personId: string, stage: string) => void;
}) {
  const personIdsInDeals = new Set(
    deals.flatMap((d) => [d.buyer_person_id, d.seller_person_id].filter(Boolean) as string[])
  );
  const buyersWithoutDeals = buyers.filter((b) => !personIdsInDeals.has(b.id));
  const sellersWithoutDeals = sellers.filter((s) => !personIdsInDeals.has(s.id));

  const stageIndex = (stage: string) => STAGE_ORDER.indexOf(stage);
  const prevStage = (stage: string) => {
    const i = stageIndex(stage);
    return i > 0 ? STAGE_ORDER[i - 1] : null;
  };
  const nextStage = (stage: string) => {
    const i = stageIndex(stage);
    return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {STAGE_ORDER.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        const personsInStage = [
          ...buyersWithoutDeals.filter((b) => b.status === stage),
          ...sellersWithoutDeals.filter((s) => s.status === stage),
        ];
        const count = stageDeals.length + personsInStage.length;
        const prev = prevStage(stage);
        const next = nextStage(stage);
        return (
          <div
            key={stage}
            className="rounded-xl border p-3 flex flex-col"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              {DEAL_STAGES[stage] || stage} ({count})
            </div>
            <div className="flex flex-wrap gap-2 min-h-[44px]">
              {personsInStage.map((p) => (
                <div
                  key={`person-${p.id}-${p.type}`}
                  className="rounded-lg border border-[var(--border-subtle)] p-2 text-sm flex items-center gap-2 flex-wrap"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  <div className="min-w-0">
                    <span className="text-xs text-[var(--text-muted)] uppercase">
                      {p.type === "buyer" ? t("buyer") : t("seller")}:
                    </span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{p.full_name}</span>
                    {p.phone && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{p.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={!prev}
                      onClick={() => prev && onPersonStage(p.id, prev)}
                      className="w-8 h-8 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Previous stage"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      disabled={!next}
                      onClick={() => next && onPersonStage(p.id, next)}
                      className="w-8 h-8 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Next stage"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              ))}
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-lg border border-[var(--border-subtle)] p-2 text-sm flex items-center gap-2 flex-wrap"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  <div className="min-w-0">
                    {deal.listing_id && (
                      <Link
                        href={`/dashboard/listings/${deal.listing_id}/view`}
                        className="text-[var(--orange)] hover:underline"
                      >
                        {deal.listing_property_type
                          ? (getPropertyTypeKey(deal.listing_property_type)
                            ? t(getPropertyTypeKey(deal.listing_property_type)!)
                            : deal.listing_property_type)
                          : t("listing")}{" "}
                        #{deal.listing_id}
                      </Link>
                    )}
                    {(deal.buyer_name || deal.seller_name) && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {[deal.buyer_name, deal.seller_name].filter(Boolean).join(" / ")}
                      </p>
                    )}
                    {deal.listing_price_vnd && (
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {formatPrice(deal.listing_price_vnd)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={!prev}
                      onClick={() => prev && onDealStage(deal.id, prev)}
                      className="w-8 h-8 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Previous stage"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      disabled={!next}
                      onClick={() => next && onDealStage(deal.id, next)}
                      className="w-8 h-8 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Next stage"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense>
      <CRMPageInner />
    </Suspense>
  );
}

function CRMPageInner() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(
    tabParam && ["agents", "sellers", "buyers", "deals"].includes(tabParam)
      ? tabParam
      : "agents"
  );
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [sellers, setSellers] = useState<PersonRow[]>([]);
  const [buyers, setBuyers] = useState<PersonRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [showAddBuyer, setShowAddBuyer] = useState(false);
  const [newSeller, setNewSeller] = useState({ full_name: "", phone: "", email: "", status: "lead" });
  const [newBuyer, setNewBuyer] = useState({
    full_name: "",
    phone: "",
    email: "",
    status: "lead",
    notes: "",
  });
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    buyer_person_id: "",
    seller_person_id: "",
    listing_id: "",
    stage: "lead",
  });
  const [personListingsByPerson, setPersonListingsByPerson] = useState<Record<string, PersonListingRow[]>>({});
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [addListingPersonId, setAddListingPersonId] = useState<string | null>(null);
  const [newAssociation, setNewAssociation] = useState({ listing_id: "", role: "buyer_interest" as "buyer_interest" | "seller", rating: "" });
  const [agentFilter, setAgentFilter] = useState<"all" | "favorite" | "active">("all");
  const [favoriteAgentIds, setFavoriteAgentIds] = useState<number[]>([]);
  const [activeAgentIds, setActiveAgentIds] = useState<number[]>([]);
  const [listingOptionsForDropdown, setListingOptionsForDropdown] = useState<Array<{
    id: number;
    ward: string | null;
    street: string | null;
    price_vnd: number | null;
    property_type: string | null;
    area_m2: number | null;
    status: string;
    source: string;
  }>>([]);
  const [listingDropdownFilter, setListingDropdownFilter] = useState("");
  const [listingOptionsLoaded, setListingOptionsLoaded] = useState(false);

  const fetchListingOptions = useCallback(async () => {
    const res = await fetch("/api/listings/for-select?source=both&limit=100");
    if (res.ok) {
      const data = await res.json();
      setListingOptionsForDropdown(data.listings ?? []);
      setListingOptionsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (tabParam && ["agents", "sellers", "buyers", "deals"].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if ((tab === "sellers" || tab === "buyers" || tab === "deals") && !listingOptionsLoaded) {
      fetchListingOptions();
    }
  }, [tab, listingOptionsLoaded, fetchListingOptions]);

  const fetchFavorites = useCallback(async () => {
    const res = await fetch("/api/crm/favorites");
    if (res.ok) {
      const data = await res.json();
      setFavoriteAgentIds(data.agent_ids ?? []);
    }
  }, []);

  const fetchActiveAgentIds = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      const convos = data.conversations ?? [];
      const ids = new Set<number>();
      convos.forEach((c: { agent_1_id: number; agent_2_id: number }) => {
        if (c.agent_1_id !== user?.id) ids.add(c.agent_1_id);
        if (c.agent_2_id !== user?.id) ids.add(c.agent_2_id);
      });
      setActiveAgentIds(Array.from(ids));
    }
  }, [user?.id]);

  const fetchPersonListings = useCallback(async (personId: string) => {
    const res = await fetch(`/api/person-listings?person_id=${encodeURIComponent(personId)}`);
    if (res.ok) {
      const data = await res.json();
      setPersonListingsByPerson((prev) => ({ ...prev, [personId]: data.person_listings ?? [] }));
    }
  }, []);

  /** Preload all person_listings for a type so "Listings (n)" is correct without expanding. */
  const fetchPersonListingsByType = useCallback(async (type: "buyer" | "seller") => {
    const res = await fetch(`/api/person-listings?type=${type}`);
    if (!res.ok) return;
    const data = await res.json();
    const list: PersonListingRow[] = data.person_listings ?? [];
    const byPerson: Record<string, PersonListingRow[]> = {};
    for (const pl of list) {
      const pid = pl.person_id;
      if (!byPerson[pid]) byPerson[pid] = [];
      byPerson[pid].push(pl);
    }
    setPersonListingsByPerson((prev) => ({ ...prev, ...byPerson }));
  }, []);

  const filteredListingOptions = listingDropdownFilter.trim()
    ? listingOptionsForDropdown.filter((l) => {
        const s = [l.id, l.ward, l.street, l.price_vnd, l.property_type].filter(Boolean).join(" ").toLowerCase();
        return s.includes(listingDropdownFilter.trim().toLowerCase());
      })
    : listingOptionsForDropdown;

  /** Listings for a person: person_listings + listings from deals (where person is buyer/seller). */
  const getCombinedListingsForPerson = useCallback(
    (personId: string, personType: "buyer" | "seller"): Array<PersonListingRow & { fromDeal?: boolean; dealId?: string }> => {
      const pls = personListingsByPerson[personId] ?? [];
      const plListingIds = new Set(pls.map((pl) => pl.listing_id));
      const fromDeals = deals
        .filter(
          (d) =>
            (personType === "buyer" ? d.buyer_person_id === personId : d.seller_person_id === personId) &&
            d.listing_id != null &&
            !plListingIds.has(d.listing_id)
        )
        .map((d) => ({
          id: `deal-${d.id}`,
          person_id: personId,
          listing_id: d.listing_id!,
          role: personType === "seller" ? "seller" : "buyer_interest",
          rating: null,
          notes: null,
          listing_ward: d.listing_ward,
          listing_property_type: d.listing_property_type,
          listing_price_vnd: d.listing_price_vnd,
          fromDeal: true as const,
          dealId: d.id,
        }));
      return [...pls.map((pl) => ({ ...pl, fromDeal: false as const })), ...fromDeals];
    },
    [deals, personListingsByPerson]
  );

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    if (res.ok) {
      const data = await res.json();
      setAgents(data.agents ?? []);
    }
  }, []);

  const fetchSellers = useCallback(async () => {
    const res = await fetch("/api/persons?type=seller");
    if (res.ok) {
      const data = await res.json();
      setSellers(data.persons ?? []);
    }
  }, []);

  const fetchBuyers = useCallback(async () => {
    const res = await fetch("/api/persons?type=buyer");
    if (res.ok) {
      const data = await res.json();
      setBuyers(data.persons ?? []);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    const res = await fetch("/api/deals");
    if (res.ok) {
      const data = await res.json();
      setDeals(data.deals ?? []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === "agents") {
      Promise.all([fetchAgents(), fetchFavorites(), fetchActiveAgentIds()]).finally(() =>
        setLoading(false)
      );
    } else if (tab === "sellers") {
      Promise.all([fetchSellers(), fetchDeals()])
        .then(() => fetchPersonListingsByType("seller"))
        .finally(() => setLoading(false));
    } else if (tab === "buyers") {
      Promise.all([fetchBuyers(), fetchDeals()])
        .then(() => fetchPersonListingsByType("buyer"))
        .finally(() => setLoading(false));
    } else if (tab === "deals") {
      Promise.all([fetchDeals(), fetchSellers(), fetchBuyers()])
        .then(() => {
          fetchPersonListingsByType("seller");
          fetchPersonListingsByType("buyer");
        })
        .finally(() => setLoading(false));
    }
  }, [tab, fetchAgents, fetchSellers, fetchBuyers, fetchDeals, fetchFavorites, fetchActiveAgentIds, fetchPersonListingsByType]);

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "seller",
        full_name: newSeller.full_name,
        phone: newSeller.phone || undefined,
        email: newSeller.email || undefined,
        status: newSeller.status,
      }),
    });
    if (res.ok) {
      setNewSeller({ full_name: "", phone: "", email: "", status: "lead" });
      setShowAddSeller(false);
      fetchSellers();
    }
  };

  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "buyer",
        full_name: newBuyer.full_name,
        phone: newBuyer.phone || undefined,
        email: newBuyer.email || undefined,
        status: newBuyer.status,
        notes: newBuyer.notes || undefined,
      }),
    });
    if (res.ok) {
      setNewBuyer({ full_name: "", phone: "", email: "", status: "lead", notes: "" });
      setShowAddBuyer(false);
      fetchBuyers();
    }
  };

  const handleDealStage = async (dealId: string, stage: string) => {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) fetchDeals();
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { buyer_person_id?: string; seller_person_id?: string; listing_id?: number; stage: string } = {
      stage: newDeal.stage,
    };
    if (newDeal.buyer_person_id) payload.buyer_person_id = newDeal.buyer_person_id;
    if (newDeal.seller_person_id) payload.seller_person_id = newDeal.seller_person_id;
    const lid = newDeal.listing_id ? parseInt(newDeal.listing_id, 10) : undefined;
    if (lid && !isNaN(lid)) payload.listing_id = lid;
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setNewDeal({ buyer_person_id: "", seller_person_id: "", listing_id: "", stage: "lead" });
      setShowAddDeal(false);
      fetchDeals();
    }
  };

  const sellerIdParam = searchParams.get("seller_id");
  const buyerIdParam = searchParams.get("buyer_id");
  useEffect(() => {
    if (tab === "deals" && (sellerIdParam || buyerIdParam)) {
      setShowAddDeal(true);
      setNewDeal((d) => ({
        ...d,
        seller_person_id: sellerIdParam || d.seller_person_id,
        buyer_person_id: buyerIdParam || d.buyer_person_id,
      }));
    }
  }, [tab, sellerIdParam, buyerIdParam]);

  const handlePersonStage = useCallback(
    async (personId: string, stage: string) => {
      const res = await fetch(`/api/persons/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: stage }),
      });
      if (res.ok) {
        fetchBuyers();
        fetchSellers();
      }
    },
    [fetchBuyers, fetchSellers]
  );

  const handleAddPersonListing = async (e: React.FormEvent, personId: string, personType: string) => {
    e.preventDefault();
    const lid = parseInt(newAssociation.listing_id, 10);
    if (isNaN(lid)) return;
    const role = personType === "seller" ? "seller" : "buyer_interest";
    const rating = newAssociation.rating ? parseInt(newAssociation.rating, 10) : undefined;
    const res = await fetch("/api/person-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: personId, listing_id: lid, role, rating }),
    });
    if (res.ok) {
      setNewAssociation({ listing_id: "", role: "buyer_interest", rating: "" });
      setAddListingPersonId(null);
      fetchPersonListings(personId);
    }
  };

  const handleUpdateRating = async (plId: string, personId: string, rating: number | null) => {
    const res = await fetch(`/api/person-listings/${plId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    if (res.ok) fetchPersonListings(personId);
  };

  const handleRemovePersonListing = async (plId: string, personId: string) => {
    const res = await fetch(`/api/person-listings/${plId}`, { method: "DELETE" });
    if (res.ok) fetchPersonListings(personId);
  };

  return (
    <div className="p-3">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t("crm")}</h1>

      <div
        className="flex gap-1 p-1 rounded-lg border border-[var(--border)] mb-4 overflow-x-auto"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        {(
          [
            { key: "agents" as const, label: t("agents"), icon: Users },
            { key: "sellers" as const, label: t("sellers"), icon: Building2 },
            { key: "buyers" as const, label: t("buyers"), icon: UserPlus },
            { key: "deals" as const, label: t("deals"), icon: TrendingUp },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shrink-0 ${
              tab === key ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={tab === key ? { backgroundColor: "var(--orange)" } : undefined}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "agents" && (
        <>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {(["all", "favorite", "active"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAgentFilter(key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  agentFilter === key ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
                style={agentFilter === key ? { backgroundColor: "var(--orange)" } : undefined}
              >
                {key === "all" ? t("all") : key === "favorite" ? t("favorite") : t("active")}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
          ) : (() => {
            const filtered =
              agentFilter === "all"
                ? agents
                : agentFilter === "favorite"
                  ? agents.filter((a) => favoriteAgentIds.includes(a.id))
                  : agents.filter((a) => activeAgentIds.includes(a.id));
            return filtered.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">{t("noResults")}</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)]"
                    style={{ backgroundColor: "var(--bg-surface)" }}
                  >
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                        style={{ backgroundColor: "var(--orange)" }}
                      >
                        {(agent.first_name || agent.username || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {agent.first_name || agent.username || "—"}
                        </p>
                        {agent.phone && (
                          <p className="text-sm text-[var(--text-muted)] truncate">{agent.phone}</p>
                        )}
                      </div>
                    </Link>
                    <Link
                      href={`/dashboard/messages?agent=${agent.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--info)]/30 text-[var(--info)] hover:bg-[var(--info)]/10 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("message")}
                    </Link>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {tab === "sellers" && (
        <>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowAddSeller(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: "var(--orange)" }}
            >
              <Plus size={16} /> Add seller
            </button>
          </div>
          {showAddSeller && (
            <div
              className="mb-4 p-4 rounded-xl border border-[var(--border)]"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-[var(--text-primary)]">New seller</span>
                <button type="button" onClick={() => setShowAddSeller(false)} className="p-1">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateSeller} className="space-y-3">
                <input
                  required
                  placeholder="Full name"
                  value={newSeller.full_name}
                  onChange={(e) => setNewSeller((s) => ({ ...s, full_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <input
                  placeholder="Phone"
                  value={newSeller.phone}
                  onChange={(e) => setNewSeller((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newSeller.email}
                  onChange={(e) => setNewSeller((s) => ({ ...s, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <select
                  value={newSeller.status}
                  onChange={(e) => setNewSeller((s) => ({ ...s, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  {Object.entries(DEAL_STAGES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium rounded-lg text-white"
                  style={{ backgroundColor: "var(--orange)" }}
                >
                  Create
                </button>
              </form>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] rounded-lg border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
              No sellers. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {sellers.map((p) => {
                const combined = getCombinedListingsForPerson(p.id, "seller");
                const expanded = expandedPersonId === p.id;
                const showAdd = addListingPersonId === p.id;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface)" }}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => router.push(`/dashboard/crm/person/${p.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/crm/person/${p.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)]">{p.full_name}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {[p.phone, p.email].filter(Boolean).join(" · ")} {DEAL_STAGES[p.status] && `· ${DEAL_STAGES[p.status]}`}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/crm?tab=deals&seller_id=${p.id}`}
                        className="text-xs font-medium text-[var(--info)] hover:underline shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Create deal
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPersonId((id) => (id === p.id ? null : p.id));
                          if (expandedPersonId !== p.id) fetchPersonListings(p.id);
                        }}
                        className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                      >
                        Listings ({combined.length})
                      </button>
                    </div>
                    {expanded && (
                      <div className="border-t border-[var(--border)] px-3 pb-3 pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {combined.map((pl) => (
                          <div key={pl.id} className="flex items-center justify-between text-sm">
                            <Link
                              href={`/dashboard/listings/${pl.listing_id}/view`}
                              className="text-[var(--info)] hover:underline"
                            >
                              #{pl.listing_id} {pl.listing_ward && `· ${pl.listing_ward}`} {pl.listing_price_vnd != null && `· ${formatPrice(pl.listing_price_vnd)}`}
                            </Link>
                            {"fromDeal" in pl && pl.fromDeal ? null : (
                              <button
                                type="button"
                                onClick={() => handleRemovePersonListing(pl.id, p.id)}
                                className="text-[var(--text-muted)] hover:text-red-500 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        {showAdd ? (
                          <form
                            onSubmit={(e) => handleAddPersonListing(e, p.id, "seller")}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              type="text"
                              placeholder={t("search")}
                              value={listingDropdownFilter}
                              onChange={(e) => setListingDropdownFilter(e.target.value)}
                              className="w-28 px-2 py-1 rounded border border-[var(--border)] text-sm"
                            />
                            <select
                              required
                              value={newAssociation.listing_id}
                              onChange={(e) => setNewAssociation((a) => ({ ...a, listing_id: e.target.value }))}
                              className="min-w-[180px] px-2 py-1 rounded border border-[var(--border)] text-sm"
                            >
                              <option value="">— My Listings / Feed —</option>
                              {filteredListingOptions.map((l) => (
                                <option key={l.id} value={l.id}>
                                  #{l.id} {l.ward || l.street || ""} {l.price_vnd != null ? formatPrice(l.price_vnd) : ""}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="text-xs font-medium text-[var(--info)]">Add</button>
                            <button type="button" onClick={() => setAddListingPersonId(null)} className="text-xs text-[var(--text-muted)]">Cancel</button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddListingPersonId(p.id)}
                            className="text-xs font-medium text-[var(--info)] hover:underline"
                          >
                            + Add listing
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "buyers" && (
        <>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowAddBuyer(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: "var(--orange)" }}
            >
              <Plus size={16} /> Add buyer
            </button>
          </div>
          {showAddBuyer && (
            <div
              className="mb-4 p-4 rounded-xl border border-[var(--border)]"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-[var(--text-primary)]">New buyer</span>
                <button type="button" onClick={() => setShowAddBuyer(false)} className="p-1">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateBuyer} className="space-y-3">
                <input
                  required
                  placeholder="Full name"
                  value={newBuyer.full_name}
                  onChange={(e) => setNewBuyer((s) => ({ ...s, full_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <input
                  placeholder="Phone"
                  value={newBuyer.phone}
                  onChange={(e) => setNewBuyer((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newBuyer.email}
                  onChange={(e) => setNewBuyer((s) => ({ ...s, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <textarea
                  placeholder="Needs / notes"
                  value={newBuyer.notes}
                  onChange={(e) => setNewBuyer((s) => ({ ...s, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                />
                <select
                  value={newBuyer.status}
                  onChange={(e) => setNewBuyer((s) => ({ ...s, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)]"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  {Object.entries(DEAL_STAGES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium rounded-lg text-white"
                  style={{ backgroundColor: "var(--orange)" }}
                >
                  Create
                </button>
              </form>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] rounded-lg border border-[var(--border)]" style={{ backgroundColor: "var(--bg-surface)" }}>
              No buyers. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {buyers.map((p) => {
                const combined = getCombinedListingsForPerson(p.id, "buyer");
                const expanded = expandedPersonId === p.id;
                const showAdd = addListingPersonId === p.id;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface)" }}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => router.push(`/dashboard/crm/person/${p.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/crm/person/${p.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)]">{p.full_name}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {[p.phone, p.email].filter(Boolean).join(" · ")} {DEAL_STAGES[p.status] && `· ${DEAL_STAGES[p.status]}`}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/crm?tab=deals&buyer_id=${p.id}`}
                        className="text-xs font-medium text-[var(--info)] hover:underline shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Create deal
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPersonId((id) => (id === p.id ? null : p.id));
                          if (expandedPersonId !== p.id) fetchPersonListings(p.id);
                        }}
                        className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                      >
                        Listings ({combined.length})
                      </button>
                    </div>
                    {expanded && (
                      <div className="border-t border-[var(--border)] px-3 pb-3 pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {combined.map((pl) => (
                          <div key={pl.id} className="flex items-center justify-between gap-2 text-sm">
                            <Link
                              href={`/dashboard/listings/${pl.listing_id}/view`}
                              className="text-[var(--info)] hover:underline shrink-0"
                            >
                              #{pl.listing_id} {pl.listing_ward && `· ${pl.listing_ward}`} {pl.listing_price_vnd != null && `· ${formatPrice(pl.listing_price_vnd)}`}
                            </Link>
                            {"fromDeal" in pl && pl.fromDeal ? (
                              <span className="text-[var(--text-muted)] text-xs shrink-0">—</span>
                            ) : (
                              <>
                                <span className="text-[var(--text-muted)] shrink-0">Rating:</span>
                                <select
                                  value={pl.rating ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    handleUpdateRating(pl.id, p.id, v === "" ? null : parseInt(v, 10));
                                  }}
                                  className="w-12 px-1 py-0.5 rounded border border-[var(--border)] text-xs"
                                >
                                  <option value="">—</option>
                                  {[1, 2, 3, 4, 5].map((r) => (
                                    <option key={r} value={r}>{r} ★</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePersonListing(pl.id, p.id)}
                                  className="text-[var(--text-muted)] hover:text-red-500 text-xs shrink-0"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {showAdd ? (
                          <form
                            onSubmit={(e) => handleAddPersonListing(e, p.id, "buyer")}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              type="text"
                              placeholder={t("search")}
                              value={listingDropdownFilter}
                              onChange={(e) => setListingDropdownFilter(e.target.value)}
                              className="w-28 px-2 py-1 rounded border border-[var(--border)] text-sm"
                            />
                            <select
                              required
                              value={newAssociation.listing_id}
                              onChange={(e) => setNewAssociation((a) => ({ ...a, listing_id: e.target.value }))}
                              className="min-w-[180px] px-2 py-1 rounded border border-[var(--border)] text-sm"
                            >
                              <option value="">— My Listings / Feed —</option>
                              {filteredListingOptions.map((l) => (
                                <option key={l.id} value={l.id}>
                                  #{l.id} {l.ward || l.street || ""} {l.price_vnd != null ? formatPrice(l.price_vnd) : ""}
                                </option>
                              ))}
                            </select>
                            <select
                              value={newAssociation.rating}
                              onChange={(e) => setNewAssociation((a) => ({ ...a, rating: e.target.value }))}
                              className="w-16 px-2 py-1 rounded border border-[var(--border)] text-sm"
                            >
                              <option value="">Rating (opt)</option>
                              {[1, 2, 3, 4, 5].map((r) => (
                                <option key={r} value={r}>{r} ★</option>
                              ))}
                            </select>
                            <button type="submit" className="text-xs font-medium text-[var(--info)]">Add</button>
                            <button type="button" onClick={() => setAddListingPersonId(null)} className="text-xs text-[var(--text-muted)]">Cancel</button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddListingPersonId(p.id)}
                            className="text-xs font-medium text-[var(--info)] hover:underline"
                          >
                            + Add listing
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "deals" && (
        <>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowAddDeal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: "var(--orange)" }}
            >
              <Plus size={16} /> Add deal
            </button>
          </div>
          {showAddDeal && (
            <div
              className="mb-4 p-4 rounded-xl border border-[var(--border)]"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-[var(--text-primary)]">New deal</span>
                <button type="button" onClick={() => setShowAddDeal(false)} className="p-1">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateDeal} className="space-y-3">
                <div>
                  <label className="block text-xs mb-1 text-[var(--text-secondary)]">Buyer</label>
                  <select
                    value={newDeal.buyer_person_id}
                    onChange={(e) => setNewDeal((d) => ({ ...d, buyer_person_id: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>{b.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-[var(--text-secondary)]">Seller</label>
                  <select
                    value={newDeal.seller_person_id}
                    onChange={(e) => setNewDeal((d) => ({ ...d, seller_person_id: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-[var(--text-secondary)]">Listing (optional)</label>
                  <input
                    type="text"
                    placeholder={t("search")}
                    value={listingDropdownFilter}
                    onChange={(e) => setListingDropdownFilter(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm mb-1 border border-[var(--border)]"
                    style={{ backgroundColor: "var(--bg-input)" }}
                  />
                  <select
                    value={newDeal.listing_id}
                    onChange={(e) => setNewDeal((d) => ({ ...d, listing_id: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--border)]"
                    style={{ backgroundColor: "var(--bg-input)" }}
                  >
                    <option value="">— None / My Listings / Feed —</option>
                    {filteredListingOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} {l.ward || l.street || ""} {l.price_vnd != null ? formatPrice(l.price_vnd) : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-[var(--text-secondary)]">Stage</label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal((d) => ({ ...d, stage: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(DEAL_STAGES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium rounded-lg text-white"
                  style={{ backgroundColor: "var(--orange)" }}
                >
                  Create deal
                </button>
              </form>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)]">{t("loading")}</div>
          ) : (
            <DealsBoard
              deals={deals}
              buyers={buyers}
              sellers={sellers}
              formatPrice={formatPrice}
              t={t as (key: string) => string}
              onDealStage={handleDealStage}
              onPersonStage={handlePersonStage}
            />
          )}
          <p className="text-xs text-[var(--text-muted)] mt-4">
            People appear in the column that matches their status. Use &lt; and &gt; to move one stage left or right (deals or person status).
          </p>
        </>
      )}
    </div>
  );
}
