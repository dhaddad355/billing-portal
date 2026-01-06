import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const DEFAULT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// GET /api/app/settings/letter-settings - Get letter settings (header/footer)
export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("letter_settings")
      .select("*")
      .eq("id", DEFAULT_SETTINGS_ID)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings exist, return defaults
        return NextResponse.json({
          settings: {
            id: DEFAULT_SETTINGS_ID,
            header_html: "",
            footer_html: "",
          },
        });
      }
      console.error("Error fetching letter settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Error in letter settings GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/settings/letter-settings - Update letter settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.header_html !== undefined) updateData.header_html = body.header_html;
    if (body.footer_html !== undefined) updateData.footer_html = body.footer_html;

    // Try to update existing settings
    const { data, error } = await supabase
      .from("letter_settings")
      .update(updateData)
      .eq("id", DEFAULT_SETTINGS_ID)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings exist, create them
        const { data: newData, error: insertError } = await supabase
          .from("letter_settings")
          .insert({
            id: DEFAULT_SETTINGS_ID,
            header_html: body.header_html || "",
            footer_html: body.footer_html || "",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating letter settings:", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ settings: newData });
      }
      console.error("Error updating letter settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Error in letter settings PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
