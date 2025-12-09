import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/app/quotes/settings - Get all quote settings
export async function GET() {
  try {
    const supabase = getServiceClient();

    // Fetch all settings in parallel
    const [
      { data: pricingGrid, error: pricingError },
      { data: discounts, error: discountsError },
      { data: addons, error: addonsError },
      { data: financingSettings, error: financingError },
    ] = await Promise.all([
      supabase
        .from("pricing_grid")
        .select("*")
        .eq("is_active", true)
        .order("treatment_type", { ascending: true }),
      supabase
        .from("quote_discounts")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("quote_addons")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("quote_financing_settings")
        .select("*")
        .order("setting_key", { ascending: true }),
    ]);

    if (pricingError || discountsError || addonsError || financingError) {
      const error = pricingError || discountsError || addonsError || financingError;
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: error!.message }, { status: 500 });
    }

    // Convert financing settings array to object
    const financingSettingsObj = (financingSettings || []).reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      pricing_grid: pricingGrid || [],
      discounts: discounts || [],
      addons: addons || [],
      financing_settings: financingSettingsObj,
    });
  } catch (error) {
    console.error("Error in settings GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
