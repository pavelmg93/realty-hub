import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích tin rao bất động sản Việt Nam. Nhiệm vụ: trích xuất thông tin có cấu trúc từ tin rao thô.

Trả về ONLY JSON hợp lệ với cấu trúc sau:
{
  "fields": {
    "property_type": "nha_pho" | "can_ho" | "dat" | "villa" | "nha_rieng" | "phong_tro" | "mat_bang" | "kho_xuong" | null,
    "transaction_type": "ban" | "cho_thue" | null,
    "price_vnd": number | null,
    "price_raw": "chuỗi giá gốc" | null,
    "area_m2": number | null,
    "address_raw": "địa chỉ đầy đủ" | null,
    "ward": "tên phường/xã" | null,
    "street": "tên đường" | null,
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
    "distance_to_beach_m": number | null,
    "commission": string | null
  },
  "confidence": { "tên_field": 0.0-1.0 },
  "duplicate_warning": { "found": false, "listing_id": null, "similarity": 0 },
  "description_draft": "Mô tả sạch tiếng Việt 2-3 câu",
  "follow_up_questions": [
    { "field": "tên_field", "question_vi": "Câu hỏi tiếng Việt", "question_en": "English question" }
  ]
}

QUY TẮC QUAN TRỌNG:

Giá:
- "3.5 tỷ" hoặc "3,5 tỷ" = 3500000000
- "800 triệu" hoặc "800tr" = 800000000
- "1.2 tỷ rưỡi" = 1250000000
- "thương lượng" / "tl" → negotiable=true, price_vnd=null
- Lưu chuỗi giá gốc vào price_raw

Địa chỉ (address_raw):
- Luôn điền address_raw: kết hợp số nhà + tên đường + phường + quận thành chuỗi đầy đủ
- Ví dụ: "123 Nguyễn Thị Minh Khai, P. Lộc Thọ, Nha Trang"
- Trích xuất ward (tên phường) và street (tên đường) riêng biệt

Pháp lý (legal_status):
- "sổ đỏ" / "sổ đỏ chính chủ" → "so_do"
- "sổ hồng" / "pink book" → "so_hong"
- "hợp đồng" / "hđmb" → "hop_dong"
- "giấy tay" / "viết tay" → "giay_tay"
- "hoàn công" → "hoan_cong" (nếu không có trong enum, ghi vào description_draft)

Đường vào (access_road):
- "mặt tiền" / "mặt đường" / "mặt phố" → "mat_duong"
- "hẻm ô tô" / "hẻm xe hơi" → "hem_oto"
- "hẻm xe máy" / "hẻm nhỏ" → "hem_xe_may"
- "hẻm" (không rõ) → "hem_nho"

Kết cấu (structure_type):
- "đúc" / "nhà đúc" / "bê tông cốt thép" → "me_duc"
- "gác lửng" → "gac_lung"
- "trệt lầu" / "trệt + lầu" → "tret_lau"
- "cấp 4" → "cap_4"

Hướng (direction):
- Đ / Đông → "dong"
- T / Tây → "tay"
- N / Nam → "nam"
- B / Bắc → "bac"
- ĐN / Đông Nam → "dong_nam"
- TN / Tây Nam → "tay_nam"
- ĐB / Đông Bắc → "dong_bac"
- TB / Tây Bắc → "tay_bac"

Đặc điểm lô đất:
- "nở hậu" / "nở hau" = lô đất mở rộng phía sau → ghi vào description_draft
- "đất vuông" / "vuông vức" → ghi vào description_draft
- "2 mặt tiền" / "2MT" → corner_lot=true

Số liên hệ:
- Nếu có nhiều số điện thoại, lấy số đầu tiên
- Không đưa số điện thoại vào các field khác

Mặc định:
- transaction_type = "ban" nếu không có từ "cho thuê", "cho thuê", "thuê"
- Chỉ điền field khi có đủ dữ liệu để tự tin
- description_draft phải là mô tả sạch, không copy nguyên văn
- follow_up_questions: để mảng rỗng []`;

const GEMINI_TIMEOUT_MS = 30000;

/** Convert price_vnd number to short Vietnamese string, e.g. 3500000000 → "3.5 tỷ" */
function priceVndToShort(vnd: number): string {
  if (vnd >= 1_000_000_000) {
    const ty = vnd / 1_000_000_000;
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (vnd >= 1_000_000) {
    const trieu = vnd / 1_000_000;
    return `${trieu % 1 === 0 ? trieu.toFixed(0) : trieu.toFixed(0)} triệu`;
  }
  return `${vnd.toLocaleString("vi-VN")} đ`;
}

/** Parse Vietnamese price text to VND number, e.g. "3.5 tỷ" → 3500000000 */
export function parseVietnamesePrice(text: string): number | null {
  // "3.5 tỷ", "3,5 tỷ", "3 tỷ rưỡi" (rưỡi = 0.5)
  const tyMatch = text.match(/(\d+(?:[.,]\d+)?)\s*tỷ(?:\s+rưỡi)?/i);
  if (tyMatch) {
    const base = parseFloat(tyMatch[1].replace(",", ".")) * 1_000_000_000;
    const isRuoi = /rưỡi/i.test(text);
    return Math.round(base + (isRuoi ? 500_000_000 : 0));
  }
  // "800 triệu", "800tr", "800 tr"
  const trieuMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr\b)/i);
  if (trieuMatch) {
    return Math.round(parseFloat(trieuMatch[1].replace(",", ".")) * 1_000_000);
  }
  return null;
}

type ParseResponse = {
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  duplicate_warning: { found: boolean; listing_id: number | null; similarity: number };
  description_draft: string;
  follow_up_questions: Array<{ field: string; question_vi: string; question_en: string }>;
  geo_from_exif: { lat: number; lng: number } | null;
  ai_used: boolean;
};

async function callGeminiOnce(text: string): Promise<ParseResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Phân tích tin rao này:\n\n${text}` },
  ]);

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);

  const fields = parsed.fields || {};
  if (typeof fields.price_vnd === "number" && fields.price_vnd > 0) {
    fields.price_short = priceVndToShort(fields.price_vnd);
  }
  return {
    fields,
    confidence: parsed.confidence || {},
    duplicate_warning: parsed.duplicate_warning || { found: false, listing_id: null, similarity: 0 },
    description_draft: parsed.description_draft || text.slice(0, 500),
    follow_up_questions: parsed.follow_up_questions || [],
    geo_from_exif: null,
    ai_used: true,
  };
}

async function parseWithGemini(text: string): Promise<ParseResponse | null> {
  if (!GEMINI_API_KEY) return null;

  const withTimeout = (attempt: () => Promise<ParseResponse>) =>
    Promise.race([
      attempt(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), GEMINI_TIMEOUT_MS)
      ),
    ]);

  // Try once, retry once on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(() => callGeminiOnce(text));
    } catch (err) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, err);
      if (attempt === 1) return null;
    }
  }
  return null;
}

function parseWithMock(text: string): ParseResponse {
  const fields: Record<string, unknown> = {};
  const confidence: Record<string, number> = {};

  const parsedPrice = parseVietnamesePrice(text);
  if (parsedPrice) {
    fields.price_vnd = parsedPrice;
    fields.price_short = priceVndToShort(parsedPrice);
    confidence.price_vnd = 0.85;
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

  // Legal status
  if (/sổ đỏ|so do/i.test(text)) {
    fields.legal_status = "so_do";
    confidence.legal_status = 0.85;
  } else if (/sổ hồng|so hong/i.test(text)) {
    fields.legal_status = "so_hong";
    confidence.legal_status = 0.85;
  } else if (/hợp đồng|hop dong/i.test(text)) {
    fields.legal_status = "hop_dong";
    confidence.legal_status = 0.8;
  } else if (/giấy tay|giay tay/i.test(text)) {
    fields.legal_status = "giay_tay";
    confidence.legal_status = 0.8;
  }

  // Access road
  if (/mặt tiền|mặt đường|mặt phố/i.test(text)) {
    fields.access_road = "mat_duong";
    confidence.access_road = 0.85;
  } else if (/hẻm ô tô|hem oto/i.test(text)) {
    fields.access_road = "hem_oto";
    confidence.access_road = 0.8;
  }

  // Structure type
  if (/đúc|be tong/i.test(text)) {
    fields.structure_type = "me_duc";
    confidence.structure_type = 0.75;
  } else if (/cấp 4|cap 4/i.test(text)) {
    fields.structure_type = "cap_4";
    confidence.structure_type = 0.8;
  }

  // address_raw: best-effort assembly
  if (fields.street || fields.ward) {
    const parts: string[] = [];
    if (fields.street) parts.push(`Đường ${fields.street}`);
    if (fields.ward) parts.push(`P. ${fields.ward}`);
    parts.push("Nha Trang");
    fields.address_raw = parts.join(", ");
    confidence.address_raw = 0.6;
  }

  return {
    fields,
    confidence,
    duplicate_warning: { found: false, listing_id: null, similarity: 0 },
    description_draft: text.slice(0, 500),
    follow_up_questions: [],
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
