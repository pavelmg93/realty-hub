import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Coerce value to number (handles BIGINT strings from node-postgres)
const coerceNum = z.preprocess(
  (v) =>
    v === null || v === undefined || v === ""
      ? null
      : typeof v === "string"
        ? (isNaN(Number(v)) ? null : Number(v))
        : v,
  z.number().nullable().optional(),
);

const coerceInt = z.preprocess(
  (v) =>
    v === null || v === undefined || v === ""
      ? null
      : typeof v === "string"
        ? (isNaN(parseInt(v, 10)) ? null : parseInt(v, 10))
        : v,
  z.number().int().nullable().optional(),
);

// Coerce empty strings to null for optional string fields
const optStr = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().nullable().optional(),
);

export const listingSchema = z.object({
  property_type: optStr,
  transaction_type: optStr,
  price_raw: optStr,
  price_vnd: coerceNum,
  area_m2: coerceNum,
  address_raw: optStr,
  ward: optStr,
  street: optStr,
  district: optStr,
  num_bedrooms: coerceInt,
  num_floors: coerceInt,
  frontage_m: coerceNum,
  access_road: optStr,
  furnished: optStr,
  description: optStr,
  status: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z
      .enum([
        "just_listed",
        "for_sale",
        "price_dropped",
        "price_increased",
        "deposit",
        "sold",
        "not_for_sale",
      ])
      .optional()
      .default("for_sale"),
  ),
  freestyle_text: optStr,
  legal_status: optStr,
  num_bathrooms: coerceInt,
  structure_type: optStr,
  direction: optStr,
  depth_m: coerceNum,
  corner_lot: z.boolean().optional().default(false),
  price_per_m2: coerceNum,
  negotiable: z.boolean().optional().default(false),
  rental_income_vnd: coerceNum,
  has_elevator: z.boolean().optional().default(false),
  nearby_amenities: z.array(z.string()).nullable().optional(),
  investment_use_case: z.array(z.string()).nullable().optional(),
  outdoor_features: z.array(z.string()).nullable().optional(),
  special_rooms: z.array(z.string()).nullable().optional(),
  feng_shui: optStr,
  total_construction_area: coerceNum,
  land_characteristics: optStr,
  traffic_connectivity: optStr,
  building_type: optStr,
  latitude: coerceNum,
  longitude: coerceNum,
  road_width_m: coerceNum,
  num_frontages: coerceInt,
  distance_to_beach_m: coerceNum,
  title_standardized: optStr,
  commission: optStr,
  commission_pct: coerceNum,
  commission_months: coerceInt,
  ward_new: optStr,
});

export const messageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty"),
  listing_id: z.number().int().nullable().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
