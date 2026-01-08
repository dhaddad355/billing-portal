import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/providers/search - Search providers by name or practice
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json({ providers: [] });
    }

    // Search across first_name, last_name, and practice name using OR
    const { data, error } = await supabase
      .from("providers")
      .select(`
        *,
        practices (*)
      `)
      .eq("is_active", true)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order("last_name", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Error searching providers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also search by practice name
    const { data: practiceProviders, error: practiceError } = await supabase
      .from("providers")
      .select(`
        *,
        practices!inner (*)
      `)
      .eq("is_active", true)
      .ilike("practices.name", `%${query}%`)
      .order("last_name", { ascending: true })
      .limit(20);

    if (practiceError) {
      console.error("Error searching by practice:", practiceError);
    }

    // Combine and dedupe results
    const allProviders = [...(data || [])];
    const existingIds = new Set(allProviders.map((p) => p.id));
    
    for (const provider of practiceProviders || []) {
      if (!existingIds.has(provider.id)) {
        allProviders.push(provider);
      }
    }

    // Sort by last name
    allProviders.sort((a, b) => a.last_name.localeCompare(b.last_name));

    return NextResponse.json({ providers: allProviders.slice(0, 20) });
  } catch (error) {
    console.error("Error in provider search:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
