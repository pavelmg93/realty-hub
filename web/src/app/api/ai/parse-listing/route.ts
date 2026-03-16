import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `You are a Vietnamese real estate listing parser. Given raw listing text in Vietnamese, extract structured fields.

Return ONLY valid JSON with this exact structure:
{
  "fields": {
    "property_type": "nha_pho" | "can_ho" | "dat" | "villa" | "nha_rieng" | "phong_tro" | "mat_bang" | "kho_xuong" | null,
    "transaction_type": "ban" | "cho_thue" | null,
    "price_vnd": number | null,
    "price_raw": "original price string" | null,
    "area_m2": number | null,
    "address_raw": "full address string" | null,
    "ward": "phường/xã name" | null,
    "street": "street name" | null,
    "district": "quận/huyện" | null,
    "num_bedrooms": number | null,
    "num_bathrooms": number | null,
    "num_floors": number | null,
    "frontage_m": number | null,
    "depth_m": number | null,
    "direction": "dong" | "tay" | "nam" | "bac" | "dong_bac" | "dong_nam" | "tay_bac" | "tay_nam" | null,
    "legal_status": "so_do" | "so_hong" | "hop_dong" | "giay_tay" | null,
    "access_road": "mat_duong" | "hem_oto" | "hem_xe_may" | "hem_nho" | null,
    "furnished": "full" | "co_ban" | "khong" | null,
    "corner_lot": boolean,
    "has_elevator": boolean,
    "negotiable": boolean,
    "structure_type": string | null,
    "building_type": string | null,
    "road_width_m": number | null,
    "distance_to_beach_m": number | null
  },
  "confidence": { "field_name": 0.0-1.0 },
  "duplicate_warning": { "found": false, "listing_id": null, "similarity": 0 },
  "description_draft": "Clean Vietnamese description of the property, 2-3 sentences",
  "follow_up_questions": [
    { "field": "field_name", "question_vi": "Vietnamese question", "question_en": "English question" }
  ]
}

Rules:
- Prices: "3.5 tỷ" = 3500000000, "500 triệu" = 500000000
- Only include fields you can extract with confidence
- Generate 1-3 follow-up questions for important missing fields
- description_draft should be a clean summary, not just copying the input
- All monetary values in VND (đồng)
- Default transaction_type to "ban" (sale) unless rental language is present`;

type ParseResponse = {
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  duplicate_warning: { found: boolean; listing_id: number | null; similarity: number };
  description_draft: string;
  follow_up_questions: Array<{ field: string; question_vi: string; question_en: string }>;
  geo_from_exif: { lat: number; lng: number } | null;
  ai_used: boolean;
};

async function parseWithGemini(text: string): Promise<ParseResponse | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `Parse this listing:\n\n${text}` },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return {
      fields: parsed.fields || {},
      confidence: parsed.confidence || {},
      duplicate_warning: parsed.duplicate_warning || { found: false, listing_id: null, similarity: 0 },
      description_draft: parsed.description_draft || text.slice(0, 500),
      follow_up_questions: parsed.follow_up_questions || [],
      geo_from_exif: null,
      ai_used: true,
    };
  } catch (err) {
    console.error("Gemini parse failed, falling back to mock:", err);
    return null;
  }
}

function parseWithMock(text: string): ParseResponse {
  const fields: Record<string, unknown> = {};
  const confidence: Record<string, number> = {};

  const viPrice = text.match(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty|tỉ)/i);
  if (viPrice) {
    const num = parseFloat(viPrice[1].replace(",", "."));
    fields.price_vnd = Math.round(num * 1_000_000_000);
    confidence.price_vnd = 0.85;
  }
  const viPriceTr = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr)/i);
  if (!viPrice && viPriceTr) {
    const num = parseFloat(viPriceTr[1].replace(",", "."));
    fields.price_vnd = Math.round(num * 1_000_000);
    confidence.price_vnd = 0.8;
  }

  const viArea = text.match(/(\d+(?:[.,]\d+)?)\s*m²/i) || text.match(/(\d+(?:[.,]\d+)?)\s*m\s*2/i);
  if (viArea) {
    fields.area_m2 = parseFloat((viArea[1] || "0").replace(",", "."));
    confidence.area_m2 = 0.8;
  }

  const wardMatch = text.match(/(?:phường|phuong)\s+([A-Za-zÀ-ỹ0-9\s]+?)(?:\s|,|\.|$)/i);
  if (wardMatch) {
    fields.ward = wardMatch[1].trim();
    confidence.ward = 0.75;
  }

  const floorsMatch = text.match(/(\d+)\s*(?:tầng|tang)/i);
  if (floorsMatch) {
    const n = parseInt(floorsMatch[1], 10);
    if (n > 0) {
      fields.num_floors = n;
      confidence.num_floors = 0.8;
    }
  }

  const streetMatch = text.match(/(?:đường|duong)\s+([A-Za-zÀ-ỹ0-9\s]+?)(?:\s|,|\.|$)/i);
  if (streetMatch) {
    fields.street = streetMatch[1].trim();
    confidence.street = 0.7;
  }

  if (/nhà phố|nha pho/i.test(text)) {
    fields.property_type = "nha_pho";
    confidence.property_type = 0.8;
  } else if (/căn hộ|can ho/i.test(text)) {
    fields.property_type = "can_ho";
    confidence.property_type = 0.8;
  } else if (/đất|dat|land/i.test(text)) {
    fields.property_type = "dat";
    confidence.property_type = 0.7;
  } else if (/biệt thự|biet thu|villa/i.test(text)) {
    fields.property_type = "villa";
    confidence.property_type = 0.8;
  } else if (/nhà|nha/i.test(text)) {
    fields.property_type = "nha_rieng";
    confidence.property_type = 0.5;
  }

  fields.transaction_type = /cho thuê|cho thue|thuê|thue/i.test(text) ? "cho_thue" : "ban";

  const bedroomMatch = text.match(/(\d+)\s*(?:PN|phòng ngủ|phong ngu)/i);
  if (bedroomMatch) {
    fields.num_bedrooms = parseInt(bedroomMatch[1], 10);
    confidence.num_bedrooms = 0.8;
  }

  const bathroomMatch = text.match(/(\d+)\s*(?:WC|toilet|phòng tắm|phong tam)/i);
  if (bathroomMatch) {
    fields.num_bathrooms = parseInt(bathroomMatch[1], 10);
    confidence.num_bathrooms = 0.8;
  }

  return {
    fields,
    confidence,
    duplicate_warning: { found: false, listing_id: null, similarity: 0 },
    description_draft: text.slice(0, 500),
    follow_up_questions: [
      { field: "legal_status", question_vi: "Sổ đỏ hay sổ hồng?", question_en: "Red book or pink book?" },
      { field: "has_elevator", question_vi: "Có thang máy không?", question_en: "Does it have an elevator?" },
    ],
    geo_from_exif: null,
    ai_used: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 },
      );
    }

    // Try Gemini first, fall back to mock regex parser
    const result = (await parseWithGemini(text)) || parseWithMock(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI parse-listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
