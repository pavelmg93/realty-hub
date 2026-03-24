import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Mail, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Agents() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["all-listings-agents"],
    queryFn: () => base44.entities.Listing.list("-created_date", 500),
  });

  const { data: favAgents = [] } = useQuery({
    queryKey: ["fav-agents", user?.email],
    queryFn: () => base44.entities.FavoriteAgent.filter({ agent_email: user.email }),
    enabled: !!user?.email,
  });

  const favEmails = new Set(favAgents.map(f => f.favorited_email));

  const toggleFav = useMutation({
    mutationFn: async (agent) => {
      const existing = favAgents.find(f => f.favorited_email === agent.email);
      if (existing) {
        await base44.entities.FavoriteAgent.delete(existing.id);
      } else {
        await base44.entities.FavoriteAgent.create({
          favorited_email: agent.email,
          favorited_name: agent.full_name || agent.email,
          agent_email: user.email,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fav-agents"] }),
  });

  // Count listings per agent
  const listingCounts = {};
  listings.forEach(l => {
    if (l.agent_email) listingCounts[l.agent_email] = (listingCounts[l.agent_email] || 0) + 1;
  });

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agents Directory</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered agent{users.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-sm" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => {
            const isMe = agent.email === user?.email;
            const isFav = favEmails.has(agent.email);
            return (
              <div key={agent.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                      {agent.full_name?.[0] || agent.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{agent.full_name || "Agent"}</h3>
                        {isMe && <Badge className="bg-teal-100 text-teal-700 text-[10px]">You</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {agent.email}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Home className="w-3 h-3" /> {listingCounts[agent.email] || 0} listing{(listingCounts[agent.email] || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {!isMe && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFav.mutate(agent)}
                      className={isFav ? "text-yellow-500" : "text-gray-300"}
                    >
                      <Star className={`w-5 h-5 ${isFav ? "fill-yellow-400" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}