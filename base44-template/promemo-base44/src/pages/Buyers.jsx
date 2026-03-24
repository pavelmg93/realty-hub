import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Phone, Mail, DollarSign, Search, Loader2 } from "lucide-react";

const STATUS_COLORS = {
  Searching: "bg-blue-100 text-blue-700",
  Viewing: "bg-purple-100 text-purple-700",
  Negotiating: "bg-amber-100 text-amber-700",
  Closed: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

const EMPTY_BUYER = {
  full_name: "", phone: "", email: "", budget_min: "", budget_max: "",
  preferred_types: [], preferred_districts: [], min_bedrooms: "",
  min_area_sqm: "", requirements: "", notes: "", status: "Searching",
};

export default function Buyers() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_BUYER);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: buyers = [], isLoading } = useQuery({
    queryKey: ["buyers", user?.email],
    queryFn: () => base44.entities.Buyer.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const cleaned = { ...data };
      ["budget_min", "budget_max", "min_bedrooms", "min_area_sqm"].forEach(k => {
        if (cleaned[k] !== "" && cleaned[k] !== undefined) cleaned[k] = Number(cleaned[k]); else delete cleaned[k];
      });
      return editing
        ? base44.entities.Buyer.update(editing.id, cleaned)
        : base44.entities.Buyer.create(cleaned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_BUYER);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Buyer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buyers"] }),
  });

  const openEdit = (buyer) => {
    setEditing(buyer);
    setForm(buyer);
    setDialogOpen(true);
  };

  const filtered = buyers.filter(b =>
    !search || b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
          <p className="text-sm text-gray-500 mt-1">{buyers.length} buyer{buyers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => { setEditing(null); setForm(EMPTY_BUYER); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Buyer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search buyers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-sm" />
      </div>

      <div className="space-y-3">
        {filtered.map(buyer => (
          <div key={buyer.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {buyer.full_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{buyer.full_name}</h3>
                    <Badge className={`${STATUS_COLORS[buyer.status]} text-[10px]`}>{buyer.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {buyer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{buyer.phone}</span>}
                    {buyer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{buyer.email}</span>}
                    {(buyer.budget_min || buyer.budget_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {buyer.budget_min ? `$${buyer.budget_min.toLocaleString()}` : "—"} – {buyer.budget_max ? `$${buyer.budget_max.toLocaleString()}` : "—"}
                      </span>
                    )}
                  </div>
                  {buyer.requirements && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{buyer.requirements}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(buyer)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (window.confirm("Delete?")) deleteMutation.mutate(buyer.id); }}>
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-gray-500">No buyers found</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Buyer" : "Add Buyer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => set("full_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Budget ($)</Label><Input type="number" value={form.budget_min} onChange={e => set("budget_min", e.target.value)} /></div>
              <div><Label>Max Budget ($)</Label><Input type="number" value={form.budget_max} onChange={e => set("budget_max", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Bedrooms</Label><Input type="number" value={form.min_bedrooms} onChange={e => set("min_bedrooms", e.target.value)} /></div>
              <div><Label>Min Area (m²)</Label><Input type="number" value={form.min_area_sqm} onChange={e => set("min_area_sqm", e.target.value)} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Searching", "Viewing", "Negotiating", "Closed", "Inactive"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} rows={3} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => saveMutation.mutate(form)} disabled={!form.full_name || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}