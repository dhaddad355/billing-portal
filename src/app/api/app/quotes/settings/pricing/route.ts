import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// PUT /api/app/quotes/settings/pricing - Update pricing grid
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.id || body.price === undefined) {
      return NextResponse.json(
        { error: "ID and price are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pricing_grid")
      .update({ price: body.price })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating pricing grid:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pricing_item: data });
  } catch (error) {
    console.error("Error in pricing PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
