import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/app/practices - List all practices
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("active") !== "false";

    let query = supabase
      .from("practices")
      .select("*")
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (search && search.length >= 2) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching practices:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practices: data });
  } catch (error) {
    console.error("Error in practices GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/practices - Create a new practice
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("practices")
      .insert({
        name: body.name,
        address_line1: body.address || body.address_line1 || null,
        address_line2: body.address_line2 || null,
        city: body.city || null,
        state: body.state || null,
        zip_code: body.zip || body.zip_code || null,
        phone: body.phone || null,
        fax: body.fax || null,
        website: body.website || null,
        communication_preference: body.communication_preference || "Fax",
        notes: body.notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating practice:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practice: data }, { status: 201 });
  } catch (error) {
    console.error("Error in practices POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
