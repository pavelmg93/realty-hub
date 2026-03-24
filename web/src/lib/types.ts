export interface Agent {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export interface Listing {
  id: number;
  raw_listing_id: number | null;
  listing_hash: string | null;
  message_date: string | null;
  // Core fields
  property_type: string | null;
  transaction_type: string | null;
  price_raw: string | null;
  price_vnd: number | null;
  area_m2: number | null;
  address_raw: string | null;
  ward: string | null;
  street: string | null;
  district: string | null;
  num_bedrooms: number | null;
  num_floors: number | null;
  frontage_m: number | null;
  access_road: string | null;
  furnished: string | null;
  description: string | null;
  confidence: number;
  parse_errors: string | null;
  // 19 new features
  legal_status: string | null;
  num_bathrooms: number | null;
  structure_type: string | null;
  direction: string | null;
  depth_m: number | null;
  corner_lot: boolean;
  price_per_m2: number | null;
  negotiable: boolean;
  rental_income_vnd: number | null;
  has_elevator: boolean;
  nearby_amenities: string[] | null;
  investment_use_case: string[] | null;
  outdoor_features: string[] | null;
  special_rooms: string[] | null;
  feng_shui: string | null;
  total_construction_area: number | null;
  land_characteristics: string | null;
  traffic_connectivity: string | null;
  building_type: string | null;
  // Coordinates
  latitude: number | null;
  longitude: number | null;
  // Web app fields
  agent_id: number | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  freestyle_text: string | null;
  title_standardized: string | null;
  commission: string | null;
  commission_pct: number | null;
  commission_months: number | null;
  ward_new: string | null;
  city: string | null;
  // Joined fields (from feed)
  owner_username?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_avatar_url?: string | null;
  existing_conversation_id?: number | null;
  // Photos (joined)
  photo_count?: number;
  primary_photo?: string | null;
  // User interactions
  is_favorited?: boolean;
}

export interface ListingPhoto {
  id: number;
  listing_id: number;
  file_path: string;
  thumb_path: string | null;
  original_name: string | null;
  file_size: number | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

/** Photo uploaded to disk but not yet registered with a listing (used during creation). */
export interface StagedPhoto {
  file_path: string;
  thumb_path: string | null;
  original_name: string;
  file_size: number;
}

export interface ListingDocument {
  id: number;
  listing_id: number;
  file_path: string;
  file_name: string;
  original_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  category: DocumentCategory;
  notes: string | null;
  created_at: string;
}

export type DocumentCategory =
  | "ownership_cert"
  | "floorplan"
  | "property_sketch"
  | "use_permit"
  | "construction_permit"
  | "proposal"
  | "other";

/** Document uploaded to disk but not yet registered with a listing (used during creation). */
export interface StagedDocument {
  file_path: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  category: DocumentCategory;
  notes: string | null;
}

export interface Conversation {
  id: number;
  agent_1_id: number;
  agent_2_id: number;
  listing_id: number | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  // Joined fields
  other_agent_id?: number;
  other_agent_name?: string;
  other_agent_username?: string;
  other_agent_first_name?: string | null;
  other_agent_phone?: string | null;
  other_agent_email?: string | null;
  other_agent_avatar_url?: string | null;
  listing_property_type?: string;
  listing_ward?: string;
  listing_street?: string | null;
  listing_address_raw?: string | null;
  listing_title_standardized?: string | null;
  listing_price_vnd?: number;
  listing_area_m2?: number;
  listing_primary_photo?: string | null;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  listing_id: number | null;
  created_at: string;
  read_at: string | null;
  // Joined
  sender_name?: string;
}

export type ListingStatus =
  | "just_listed"
  | "selling"
  | "price_dropped"
  | "price_increased"
  | "deposit"
  | "sold"
  | "not_for_sale";
