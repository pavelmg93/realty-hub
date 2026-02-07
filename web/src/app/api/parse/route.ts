import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Request body must include 'text' as a string" },
        { status: 400 },
      );
    }

    // Stub response: will be replaced with actual TS parser when ready
    return NextResponse.json({
      parsed: {
        property_type: null,
        transaction_type: null,
        price_raw: null,
        price_vnd: null,
        area_m2: null,
        address_raw: null,
        ward: null,
        street: null,
        district: null,
        num_bedrooms: null,
        num_floors: null,
        frontage_m: null,
        description: text,
      },
      message:
        "Parser stub: full Vietnamese text parsing will be implemented in a future version",
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
