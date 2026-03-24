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
import { Plus, Edit, Trash2, Phone, Mail, Search, Loader2 } from "lucide-react";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
  Closed: "bg-blue-100 text-blue-700",
};

const EMPTY = { full_name: "", phone: "", email: "", address: "", properties_description: "", notes: "", status: "Active" };

export default function Sellers() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["sellers", user?.email],
    queryFn: () => base44.entities.Seller.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Seller.update(editing.id, data)
      : base44.entities.Seller.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Seller.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] }),
  });

  const openEdit = (s) => { setEditing(s); setForm(s); setDialogOpen(true); };
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const filtered = sellers.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
          <p className="text-sm text-gray-500 mt-1">{sellers.length} seller{sellers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => { setEditing(null); setForm(EMPTY); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Seller
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search sellers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-sm" />
      </div>

      <div className="space-y-3">
        {filtered.map(seller => (
          <div key={seller.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
                  {seller.full_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{seller.full_name}</h3>
                    <Badge className={`${STATUS_COLORS[seller.status]} text-[10px]`}>{seller.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {seller.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{seller.phone}</span>}
                    {seller.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{seller.email}</span>}
                  </div>
                  {seller.properties_description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{seller.properties_description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(seller)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (window.confirm("Delete?")) deleteMutation.mutate(seller.id); }}>
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-16"><p className="text-gray-500">No sellers found</p></div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Seller" : "Add Seller"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => set("full_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Active", "Inactive", "Closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Properties Description</Label><Textarea value={form.properties_description} onChange={e => set("properties_description", e.target.value)} rows={3} /></div>
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