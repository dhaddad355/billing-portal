import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/providers - List all providers with optional search
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const practiceId = searchParams.get("practice_id");
    const activeOnly = searchParams.get("active") !== "false";

    let query = supabase
      .from("providers")
      .select(`
        *,
        practices (*)
      `)
      .order("last_name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (practiceId) {
      query = query.eq("practice_id", practiceId);
    }

    // Search across first_name, last_name, and practice name
    if (search && search.length >= 3) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,practices.name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching providers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ providers: data });
  } catch (error) {
    console.error("Error in providers GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("providers")
      .insert({
        practice_id: body.practice_id || null,
        first_name: body.first_name,
        last_name: body.last_name,
        degree: body.degree || null,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
        is_active: true,
      })
      .select(`
        *,
        practices (*)
      `)
      .single();

    if (error) {
      console.error("Error creating provider:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (error) {
    console.error("Error in providers POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
