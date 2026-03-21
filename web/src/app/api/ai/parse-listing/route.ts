import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { spawn } from "child_process";
import path from "path";

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

QUAN TRỌNG — Không nhầm đặc điểm đường với tên đường:
- "đường rộng" / "đường rộng X mét" = mô tả chiều rộng đường vào, KHÔNG phải tên đường → ghi vào road_width_m
- "hẻm ô tô" / "hẻm xe hơi" = loại hẻm, KHÔNG phải tên đường → ghi vào access_road = "hem_oto"
- "hẻm thông" / "hẻm cụt" = đặc điểm hẻm, KHÔNG phải tên đường → bỏ qua hoặc ghi vào description_draft
- Chỉ trích xuất street khi có TÊN cụ thể: "Nguyễn Thị Minh Khai", "Trần Phú", "Lê Hồng Phong", v.v.
- Nếu không có tên đường thực sự, để street = null

Danh sách đường tại Nha Trang (tham khảo):
Trần Phú, Phạm Văn Đồng, Lê Hồng Phong, Nguyễn Thiện Thuật, Yersin, Hùng Vương, Quang Trung, Thái Nguyên, Lê Thánh Tôn, Pasteur, Hai Bà Trưng, Bà Triệu, Trần Hưng Đạo, Lê Lợi, Phan Bội Châu, Phan Chu Trinh, Lý Tự Trọng, Ngô Sĩ Liên, Nguyễn Gia Thiều, Lê Thành Phương, Tô Vĩnh Diện, Yết Kiêu, Trần Văn Ơn, 2 Tháng 4, 23 Tháng 10, Hoàng Hoa Thám, Hoàng Văn Thụ, Nguyễn Trãi, Nguyễn Đình Chiểu, Nguyễn Chánh, Nguyễn Trung Trực, Nguyễn Thị Minh Khai, Võ Thị Sáu, Lý Thường Kiệt, Biệt Thự, Tháp Bà, Trần Quang Khải, Sinh Trung, Tôn Đản, Củ Chi, Đồng Nai, Hương Điền, Phong Châu, Bùi Thiện Ngộ, Trần Thị Tính, Lương Thế Vinh, Dã Tượng, Nguyễn Khanh, Trần Quý Cáp, Cửu Long, Bửu Đóa, Tản Đà, Nguyễn Khuyến, Lê Đại Hành, Nguyễn Bỉnh Khiêm, Phạm Ngọc Thạch, Nguyễn Xiển, Trần Nhân Tông, Đinh Tiên Hoàng, Nguyễn Huệ, Chu Văn An, Trần Quốc Toản, Hồng Bàng, Phạm Hùng, Ngô Quyền, Đặng Tất, Phước Long, Nguyễn Văn Cừ, Bạch Đằng, Cô Bắc, Đặng Văn Lý

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

/** Convert price_vnd number to short Vietnamese string, e.g. 3130000000 → "3.13 tỷ" */
function priceVndToShort(vnd: number): string {
  if (vnd >= 1_000_000_000) {
    const ty = vnd / 1_000_000_000;
    return `${parseFloat(ty.toFixed(2)).toString()} tỷ`;
  }
  if (vnd >= 1_000_000) {
    const trieu = vnd / 1_000_000;
    return `${parseFloat(trieu.toFixed(2)).toString()} triệu`;
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
    const candidate = streetMatch[1].trim();
    // Skip road descriptors — these are NOT street names
    const roadDescriptors = /^(rộng|hẹp|lớn|nhỏ|một chiều|hai chiều|thông|cụt)/i;
    if (!roadDescriptors.test(candidate)) {
      fields.street = candidate;
      confidence.street = 0.7;
    }
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

// ---------------------------------------------------------------------------
// Python parser layer
// ---------------------------------------------------------------------------

/** Python property_type keys → DB enum values */
const PYTHON_PROP_TYPE_MAP: Record<string, string> = {
  nha: "nha_rieng",
  dat: "dat",
  can_ho: "can_ho",
  phong_tro: "phong_tro",
  biet_thu: "villa",
  mat_bang: "mat_bang",
  khach_san: "mat_bang", // closest match in enum
};

/** Run the Vietnamese regex parser as a subprocess. Returns null on any failure. */
async function runPythonParser(text: string): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    // In Docker: process.cwd() = /app, so parent dir = /  -> /src/parsing/...
    // In dev:    process.cwd() = .../realty-hub/web/     -> .../realty-hub/src/parsing/...
    const projectRoot = path.resolve(process.cwd(), "..");
    const script = `
import sys, json, dataclasses
sys.path.insert(0, '${projectRoot}/src')
from parsing.vietnamese_parser import parse_listing
result = parse_listing(sys.stdin.read())
d = dataclasses.asdict(result)
if d.get('parse_errors'):
    d['parse_errors'] = '; '.join(d['parse_errors'])
else:
    d['parse_errors'] = None
print(json.dumps(d, ensure_ascii=False))
`;
    const proc = spawn("python3", ["-c", script], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      timeout: 8000,
    });
    let stdout = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.on("close", (code: number) => {
      if (code === 0) {
        try { resolve(JSON.parse(stdout.trim())); } catch { resolve(null); }
      } else {
        resolve(null);
      }
    });
    proc.on("error", () => resolve(null));
    proc.stdin.write(text);
    proc.stdin.end();
  });
}

/**
 * Merge Python parser result into the Gemini parse response.
 * Python fields take priority when non-null/non-empty.
 * Gemini handles: address/ward/street/district (better contextual understanding),
 *   property_type (when Python is ambiguous), description_draft, confidence.
 */
function mergeWithPython(
  gemini: ParseResponse,
  python: Record<string, unknown> | null,
): ParseResponse {
  if (!python) return gemini;

  const merged = { ...gemini, fields: { ...gemini.fields } };
  const f = merged.fields as Record<string, unknown>;

  // Fields where Python regex is authoritative — override Gemini
  const pythonPriority = [
    "price_vnd", "price_raw", "area_m2",
    "num_bedrooms", "num_bathrooms", "num_floors",
    "frontage_m", "depth_m", "road_width_m",
    "rental_income_vnd", "access_road", "furnished",
    "direction", "legal_status", "structure_type",
    "corner_lot", "has_elevator", "negotiable",
    "num_frontages", "distance_to_beach_m",
  ];

  for (const key of pythonPriority) {
    const val = python[key];
    if (val !== null && val !== undefined && val !== "") {
      f[key] = val;
    }
  }

  // For property_type: use Python only when Gemini has no value, and map to DB enum
  if (!f.property_type && python.property_type) {
    const pyType = python.property_type as string;
    f.property_type = PYTHON_PROP_TYPE_MAP[pyType] ?? null;
  }

  // For transaction_type: Python can fill when Gemini is null
  if (!f.transaction_type && python.transaction_type) {
    f.transaction_type = python.transaction_type;
  }

  // Recompute price_short after merge
  const priceVnd = f.price_vnd as number | null;
  if (typeof priceVnd === "number" && priceVnd > 0) {
    f.price_short = priceVndToShort(priceVnd);
  }

  return merged;
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

    // Layer 1: Python regex parser (fast, accurate for numeric fields)
    // Layer 2: Gemini AI (fills gaps, handles address/type disambiguation)
    const [pythonResult, geminiResult] = await Promise.all([
      runPythonParser(text),
      parseWithGemini(text),
    ]);
    const result = mergeWithPython(geminiResult ?? parseWithMock(text), pythonResult);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI parse-listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
