import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/app/practices/[id] - Get a specific practice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Practice not found" }, { status: 404 });
      }
      console.error("Error fetching practice:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practice: data });
  } catch (error) {
    console.error("Error in practice GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/practices/[id] - Update a practice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const { id } = params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("practices")
      .update({
        name: body.name,
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        phone: body.phone,
        fax: body.fax,
        website: body.website,
        communication_preference: body.communication_preference,
        notes: body.notes,
        is_active: body.is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating practice:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practice: data });
  } catch (error) {
    console.error("Error in practice PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/app/practices/[id] - Soft delete a practice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("practices")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting practice:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practice: data });
  } catch (error) {
    console.error("Error in practice DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
