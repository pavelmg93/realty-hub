/**
 * Parse Vietnamese price notation into VND (đồng).
 *
 * Supported formats:
 *   "2ty"       → 2,000,000,000
 *   "2.5ty"     → 2,500,000,000
 *   "400tr"     → 400,000,000
 *   "400trieu"  → 400,000,000
 *   "900triệu"  → 900,000,000
 *   "1.2 tỷ"    → 1,200,000,000
 *   "500"        → 500,000,000  (plain number = triệu VND)
 *   "3500000000" → 3,500,000,000  (>= 1M treated as raw VND)
 *
 * Returns null if the input cannot be parsed.
 */
export function parseVietnamesePrice(input: string): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase().replace(/,/g, ".");

  // Match: number + optional unit
  const match = s.match(/^(\d+(?:\.\d+)?)\s*([a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*)$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unit = match[2] || "";

  if (/^(ty|tỷ|ti|tỉ|tĩ)$/.test(unit)) {
    return Math.round(num * 1_000_000_000);
  }

  if (/^(tr|trieu|triệu)$/.test(unit)) {
    return Math.round(num * 1_000_000);
  }

  // No unit — heuristic: if >= 1,000,000 treat as raw VND, otherwise treat as triệu
  if (!unit) {
    if (num >= 1_000_000) return Math.round(num);
    return Math.round(num * 1_000_000);
  }

  return null;
}
