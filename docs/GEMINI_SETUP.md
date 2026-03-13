# Gemini API Setup for AI Listing Entry

ProMemo uses **Google AI Studio** (Gemini free tier) for AI-assisted listing parsing. No Vertex AI or billing required for demo.

## 1. Get an API key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in, then open **Get API key**.
3. Create an API key and copy it.

## 2. Configure the app

Add to `.env` (never commit this file):

```bash
GEMINI_API_KEY=your_key_here
```

## 3. Install the SDK

```bash
cd web && npm install @google/generative-ai
```

## 4. Wire the parse-listing route

Edit `web/src/app/api/ai/parse-listing/route.ts`:

- Replace the **mock** implementation with a real Gemini call.
- Use model `gemini-1.5-flash` (or `gemini-1.5-flash-latest`).
- Set `responseMimeType: "application/json"` so the model returns strict JSON.
- Build a prompt that includes:
  - The user's Vietnamese listing text.
  - Instructions to extract: price_vnd, area_m2, ward, street, district, property_type, transaction_type, legal_status, num_bedrooms, num_bathrooms, num_floors, etc.
  - Instructions to check for duplicates against `existingListings` (address + price + area).
  - Instructions to return: `description_draft` (Vietnamese), `follow_up_questions` (array of { field, question_vi, question_en }), `duplicate_warning`, `geo_from_exif` (if you pass photo EXIF later).

Response shape (match this in your prompt):

```ts
{
  fields: { price_vnd?, area_m2?, ward?, street?, ... };
  confidence: { [fieldName]: 0.0–1.0 };
  duplicate_warning: { found: boolean, listing_id?: number, similarity: number };
  description_draft: string;
  follow_up_questions: { field: string, question_vi: string, question_en: string }[];
  geo_from_exif: { lat: number, lng: number } | null;
}
```

See in-code comments in `web/src/app/api/ai/parse-listing/route.ts` and **ROADMAP-v2.md** Phase 2.2–2.3 for full spec.

## 5. Optional: voice and photos

- **Voice:** Use Web Speech API with `lang='vi-VN'` in the browser, or send base64 audio to a new `/api/ai/transcribe` route using Gemini multimodal.
- **EXIF geo:** Use the `sharp` or `exif-reader` package in the parse-listing route to read GPS from uploaded photos; merge into `geo_from_exif` in the response.

## Free tier limits

- 15 requests/minute, 1M tokens/day (Gemini 1.5 Flash).
- Sufficient for a 3-user demo.
