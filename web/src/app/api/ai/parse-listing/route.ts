import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

/**
 * AI-assisted listing parsing (ROADMAP Phase 2).
 *
 * INSTRUCTIONS TO ADD GEMINI:
 * 1. Add GEMINI_API_KEY to .env (Google AI Studio key, free tier: 15 RPM, 1M TPD).
 * 2. Install: npm install @google/generative-ai
 * 3. Replace the mock implementation below with:
 *    - Import: import { GoogleGenerativeAI } from "@google/generative-ai";
 *    - const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
 *    - const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
 *    - Build prompt that includes: (a) user text, (b) existingListings for duplicate check, (c) instruction to return JSON with fields, confidence, duplicate_warning, description_draft, follow_up_questions, geo_from_exif (if photos provided).
 *    - Response schema (strict JSON): { fields: {...}, confidence: {...}, duplicate_warning: { found, listing_id?, similarity }, description_draft: string, follow_up_questions: [{ field, question_vi, question_en }], geo_from_exif: { lat, lng } | null }
 * 4. For voice: client can use Web Speech API (vi-VN) or send base64 audio to /api/ai/transcribe (implement with Gemini multimodal).
 * 5. For EXIF geo: use "sharp" or "exif-reader" in a separate step on uploaded photos; merge result into response if needed.
 *
 * See ROADMAP-v2.md Phase 2.2 and 2.3 for full spec.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const existingListings = Array.isArray(body.existingListings) ? body.existingListings : [];
    // photos?: base64[] for future EXIF + multimodal

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 },
      );
    }

    // MOCK: Extract fields from Vietnamese text. Replace with Gemini call.
    const mockFields: Record<string, unknown> = {};
    const mockConfidence: Record<string, number> = {};
    const viPrice = text.match(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty|tỉ)/i);
    if (viPrice) {
      const num = parseFloat(viPrice[1].replace(",", "."));
      mockFields.price_vnd = Math.round(num * 1_000_000_000);
      mockConfidence.price_vnd = 0.85;
    }
    const viArea = text.match(/(\d+(?:[.,]\d+)?)\s*m²/i) || text.match(/(\d+(?:[.,]\d+)?)\s*m\s*2/i);
    if (viArea) {
      const num = parseFloat((viArea[1] || "0").replace(",", "."));
      mockFields.area_m2 = num;
      mockConfidence.area_m2 = 0.8;
    }
    const wardMatch = text.match(/(?:phường|phuong)\s+([A-Za-zÀ-ỹ0-9\s]+?)(?:\s|,|\.|$)/i) ||
      text.match(/\b(Lộc Thọ|Loc Tho|Vĩnh Hải|Vinh Hai|Vĩnh Phước|Phước Hải|[\p{L}\s]+)\s*(?:,|$)/iu);
    if (wardMatch) {
      mockFields.ward = wardMatch[1].trim();
      mockConfidence.ward = 0.75;
    }
    const floorsMatch = text.match(/(\d+)\s*tầng|(\d+)\s*tang/i);
    if (floorsMatch) {
      const n = parseInt(floorsMatch[1] || floorsMatch[2] || "0", 10);
      if (n > 0) {
        mockFields.num_floors = n;
        mockConfidence.num_floors = 0.8;
      }
    }
    const streetMatch = text.match(/(?:đường|duong)\s+([A-Za-zÀ-ỹ0-9\s]+?)(?:\s|,|\.|$)/i);
    if (streetMatch) {
      mockFields.street = streetMatch[1].trim();
      mockConfidence.street = 0.7;
    }
    if (/nhà|nha|biệt thự|villa|đất|dat/i.test(text)) {
      mockFields.property_type = /đất|dat|land/i.test(text) ? "land" : "house";
      mockConfidence.property_type = 0.6;
    }
    mockFields.transaction_type = /cho thuê|cho thue|thuê|thue/i.test(text) ? "cho_thue" : "ban";

    const response = {
      fields: mockFields,
      confidence: mockConfidence,
      duplicate_warning: { found: false, listing_id: null as number | null, similarity: 0 },
      description_draft: text.slice(0, 500),
      follow_up_questions: [
        { field: "legal_status", question_vi: "Sổ đỏ hay sổ hồng?", question_en: "Red book or pink book?" },
        { field: "has_elevator", question_vi: "Có thang máy không?", question_en: "Does it have an elevator?" },
      ],
      geo_from_exif: null as { lat: number; lng: number } | null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI parse-listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
