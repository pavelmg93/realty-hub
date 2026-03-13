import type { Listing } from "./types";
import { formatPrice } from "./constants";

export async function parseListingText(
  _text: string
): Promise<Partial<Listing>> {
  console.log(
    "[AI SCAFFOLD] parseListingText called — implement with Gemini in MVP"
  );
  return {};
}

export async function generatePostDraft(
  listing: Listing,
  platform: string
): Promise<string> {
  const price = formatPrice(listing.price_vnd);
  return `🏠 ${platform} Post — ${listing.street ?? ""}, ${listing.ward ?? ""}\n💰 ${price}\n📐 ${listing.area_m2 ?? "—"}m²\n\n[AI draft available in MVP]`;
}
