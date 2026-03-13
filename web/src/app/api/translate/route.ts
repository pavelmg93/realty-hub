import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, target } = await req.json();

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      translated: `[Translation to ${target} — configure GOOGLE_TRANSLATE_API_KEY to enable]`,
      mock: true,
    });
  }

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, target, format: "text" }),
      }
    );
    const data = await res.json();
    const translated =
      data.data?.translations?.[0]?.translatedText ?? text;
    return NextResponse.json({ translated });
  } catch (e) {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
