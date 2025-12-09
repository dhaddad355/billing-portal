import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// PUT /api/app/quotes/settings/financing - Update financing settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    if (!body.setting_key || body.setting_value === undefined) {
      return NextResponse.json(
        { error: "setting_key and setting_value are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("quote_financing_settings")
      .update({ setting_value: body.setting_value })
      .eq("setting_key", body.setting_key)
      .select()
      .single();

    if (error) {
      console.error("Error updating financing setting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ setting: data });
  } catch (error) {
    console.error("Error in financing PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
