import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Compass, Scale,
  Home, Calendar, Layers, Ruler, Car, Heart, Edit, Archive,
  RotateCcw, Trash2, Send, MessageCircle
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  "Open": "bg-emerald-100 text-emerald-700",
  "In Negotiations": "bg-amber-100 text-amber-700",
  "Closing": "bg-blue-100 text-blue-700",
  "Sold": "bg-gray-100 text-gray-500",
  "Not For Sale": "bg-red-100 text-red-700",
};

const DetailRow = ({ icon: Icon, label, value }) => value ? (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
) : null;

export default function ListingDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const items = await base44.entities.Listing.filter({ id });
      return items[0];
    },
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => base44.entities.ListingComment.filter({ listing_id: id }, "-created_date"),
    enabled: !!id,
  });

  const addComment = useMutation({
    mutationFn: (content) => base44.entities.ListingComment.create({
      listing_id: id,
      content,
      author_name: user?.full_name || "Agent",
      author_email: user?.email,
    }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const updateListing = useMutation({
    mutationFn: (data) => base44.entities.Listing.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listing", id] }),
  });

  const deleteListing = useMutation({
    mutationFn: () => base44.entities.Listing.delete(id),
    onSuccess: () => navigate(createPageUrl("MyListings")),
  });

  if (isLoading) return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="aspect-[2/1] w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
    </div>
  );

  if (!listing) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Listing not found.</p>
      <Button variant="outline" onClick={() => navigate(createPageUrl("Feed"))} className="mt-4">Back to Feed</Button>
    </div>
  );

  const isOwner = user?.email === listing.agent_email;
  const photos = listing.photos?.length > 0 ? listing.photos : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80"];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl(`EditListing?id=${id}`))}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
            {listing.is_archived ? (
              <Button variant="outline" size="sm" onClick={() => updateListing.mutate({ is_archived: false })}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reactivate
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => updateListing.mutate({ is_archived: true })}>
                <Archive className="w-4 h-4 mr-1" /> Archive
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => {
              if (window.confirm("Permanently delete this listing?")) deleteListing.mutate();
            }}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Photo gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl overflow-hidden">
        <img src={photos[0]} alt="" className="w-full aspect-[4/3] object-cover" />
        {photos.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.slice(1, 5).map((url, i) => (
              <img key={i} src={url} alt="" className="w-full aspect-square object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${STATUS_COLORS[listing.transaction_status] || STATUS_COLORS["Open"]} text-xs`}>
              {listing.transaction_status}
            </Badge>
            {listing.is_archived && <Badge className="bg-gray-200 text-gray-600">Archived</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <MapPin className="w-4 h-4" /> {listing.address || listing.district}, Nha Trang
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">
            ${listing.price?.toLocaleString()}
          </p>
          {listing.price_vnd && <p className="text-sm text-gray-500">{listing.price_vnd} tỷ VND</p>}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
          <DetailRow icon={Home} label="Type" value={listing.property_type?.charAt(0).toUpperCase() + listing.property_type?.slice(1)} />
          <DetailRow icon={Maximize} label="Area" value={listing.area_sqm ? `${listing.area_sqm} m²` : null} />
          <DetailRow icon={Maximize} label="Usable Area" value={listing.usable_area_sqm ? `${listing.usable_area_sqm} m²` : null} />
          <DetailRow icon={Bed} label="Bedrooms" value={listing.bedrooms} />
          <DetailRow icon={Bath} label="Bathrooms" value={listing.bathrooms} />
          <DetailRow icon={Layers} label="Floors" value={listing.floors} />
          <DetailRow icon={Calendar} label="Year Built" value={listing.year_built} />
          <DetailRow icon={Compass} label="Direction" value={listing.direction} />
          <DetailRow icon={Ruler} label="Frontage" value={listing.frontage_m ? `${listing.frontage_m} m` : null} />
          <DetailRow icon={Car} label="Road Width" value={listing.road_width_m ? `${listing.road_width_m} m` : null} />
          <DetailRow icon={Scale} label="Legal Status" value={listing.legal_status} />
          <DetailRow icon={Home} label="Furnishing" value={listing.furnishing} />
        </div>

        <div className="space-y-6">
          {/* Agent card */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Listing Agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                {listing.agent_name?.[0] || "A"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{listing.agent_name}</p>
                <p className="text-xs text-gray-500">{listing.agent_email}</p>
                {listing.agent_phone && <p className="text-xs text-gray-500">{listing.agent_phone}</p>}
              </div>
            </div>
            {listing.commission_percent && (
              <p className="text-xs text-gray-400 mt-3">Commission: {listing.commission_percent}%</p>
            )}
          </div>

          {isOwner && listing.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Internal Notes</h3>
              <p className="text-sm text-amber-700">{listing.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Agent Discussion ({comments.length})
        </h3>

        <div className="space-y-4 mb-6">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                {c.author_name?.[0] || "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{c.author_name}</span>
                  <span className="text-[11px] text-gray-400">
                    {c.created_date ? format(new Date(c.created_date), "MMM d, h:mm a") : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No comments yet. Start the discussion.</p>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="flex-1"
          />
          <Button
            onClick={() => { if (comment.trim()) addComment.mutate(comment); }}
            disabled={!comment.trim() || addComment.isPending}
            className="bg-teal-600 hover:bg-teal-700 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}