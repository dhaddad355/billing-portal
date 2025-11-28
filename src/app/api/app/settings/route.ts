import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();

    const { data: settings, error } = await supabase
      .from("settings")
      .select("key, value, description");

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Convert array to object for easier access
    const settingsObj: Record<string, string> = {};
    settings?.forEach((setting: { key: string; value: string | null }) => {
      settingsObj[setting.key] = setting.value || "";
    });

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error("Error in settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const { error } = await supabase
        .from("settings")
        .upsert(
          {
            key,
            value: value as string,
            updated_at: now,
          },
          {
            onConflict: "key",
          }
        );

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
