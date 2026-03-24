import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2 } from "lucide-react";

const PROPERTY_TYPES = ["apartment", "house", "villa", "townhouse", "land", "commercial", "shophouse", "penthouse"];
const STATUSES = ["Open", "In Negotiations", "Closing", "Sold", "Not For Sale"];
const DIRECTIONS = ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"];
const LEGAL_STATUSES = ["Red Book", "Pink Book", "Sales Contract", "Pending", "Other"];
const FURNISHING = ["Fully Furnished", "Partially Furnished", "Unfurnished"];
const DISTRICTS = [
  "Vĩnh Hòa", "Vĩnh Hải", "Vĩnh Phước", "Vĩnh Thọ",
  "Xương Huân", "Vạn Thắng", "Vạn Thạnh", "Phương Sài",
  "Phương Sơn", "Ngọc Hiệp", "Phước Hòa", "Phước Tân",
  "Phước Hải", "Phước Long", "Vĩnh Trường", "Vĩnh Nguyên",
  "Lộc Thọ", "Tân Lập", "Phước Tiến"
];

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-gray-600">{label}</Label>
    {children}
  </div>
);

export default function ListingForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [data, setData] = useState(initial || {
    title: "", property_type: "apartment", transaction_status: "Open",
    price: "", price_vnd: "", area_sqm: "", usable_area_sqm: "",
    bedrooms: "", bathrooms: "", floors: "",
    district: "", address: "", description: "",
    year_built: "", direction: "", legal_status: "",
    furnishing: "", frontage_m: "", road_width_m: "",
    seller_name: "", commission_percent: "", notes: "",
    photos: [],
  });
  const [uploading, setUploading] = useState(false);

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    set("photos", [...(data.photos || []), ...urls]);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    set("photos", data.photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = { ...data };
    ["price", "price_vnd", "area_sqm", "usable_area_sqm", "bedrooms", "bathrooms",
     "floors", "year_built", "frontage_m", "road_width_m", "commission_percent"]
      .forEach(k => { if (cleaned[k] !== "" && cleaned[k] !== undefined) cleaned[k] = Number(cleaned[k]); else delete cleaned[k]; });
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title *">
            <Input value={data.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 3BR Sea View Apartment" required />
          </Field>
          <Field label="Property Type *">
            <Select value={data.property_type} onValueChange={v => set("property_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Transaction Status">
            <Select value={data.transaction_status} onValueChange={v => set("transaction_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="District *">
            <Select value={data.district} onValueChange={v => set("district", v)}>
              <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Address">
          <Input value={data.address} onChange={e => set("address", e.target.value)} placeholder="Full address" />
        </Field>
        <Field label="Description">
          <Textarea value={data.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Detailed description..." />
        </Field>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Price (USD) *">
            <Input type="number" value={data.price} onChange={e => set("price", e.target.value)} placeholder="150000" required />
          </Field>
          <Field label="Price (VND Billion)">
            <Input type="number" step="0.01" value={data.price_vnd} onChange={e => set("price_vnd", e.target.value)} placeholder="3.5" />
          </Field>
          <Field label="Commission %">
            <Input type="number" step="0.1" value={data.commission_percent} onChange={e => set("commission_percent", e.target.value)} placeholder="2.0" />
          </Field>
        </div>
      </section>

      {/* Property Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Property Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Area (m²)"><Input type="number" value={data.area_sqm} onChange={e => set("area_sqm", e.target.value)} /></Field>
          <Field label="Usable Area (m²)"><Input type="number" value={data.usable_area_sqm} onChange={e => set("usable_area_sqm", e.target.value)} /></Field>
          <Field label="Bedrooms"><Input type="number" value={data.bedrooms} onChange={e => set("bedrooms", e.target.value)} /></Field>
          <Field label="Bathrooms"><Input type="number" value={data.bathrooms} onChange={e => set("bathrooms", e.target.value)} /></Field>
          <Field label="Floors"><Input type="number" value={data.floors} onChange={e => set("floors", e.target.value)} /></Field>
          <Field label="Year Built"><Input type="number" value={data.year_built} onChange={e => set("year_built", e.target.value)} /></Field>
          <Field label="Frontage (m)"><Input type="number" step="0.1" value={data.frontage_m} onChange={e => set("frontage_m", e.target.value)} /></Field>
          <Field label="Road Width (m)"><Input type="number" step="0.1" value={data.road_width_m} onChange={e => set("road_width_m", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Direction">
            <Select value={data.direction || "none"} onValueChange={v => set("direction", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Legal Status">
            <Select value={data.legal_status || "none"} onValueChange={v => set("legal_status", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {LEGAL_STATUSES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Furnishing">
            <Select value={data.furnishing || "none"} onValueChange={v => set("furnishing", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {FURNISHING.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      {/* Seller & Notes */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Seller & Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Seller Name"><Input value={data.seller_name} onChange={e => set("seller_name", e.target.value)} /></Field>
        </div>
        <Field label="Internal Notes">
          <Textarea value={data.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Private notes..." />
        </Field>
      </section>

      {/* Photos */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Photos</h3>
        <div className="flex flex-wrap gap-3">
          {(data.photos || []).map((url, i) => (
            <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          <label className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
              <>
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-400">Upload</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initial ? "Update Listing" : "Create Listing"}
        </Button>
      </div>
    </form>
  );
}