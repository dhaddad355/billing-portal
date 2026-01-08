import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/providers/[id] - Get a specific provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("providers")
      .select(`
        *,
        practices (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }
      console.error("Error fetching provider:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error("Error in provider GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/providers/[id] - Update a provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("providers")
      .update({
        practice_id: body.practice_id,
        first_name: body.first_name,
        last_name: body.last_name,
        degree: body.degree,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
        is_active: body.is_active,
      })
      .eq("id", id)
      .select(`
        *,
        practices (*)
      `)
      .single();

    if (error) {
      console.error("Error updating provider:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error("Error in provider PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/providers/[id] - Soft delete a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("providers")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting provider:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error("Error in provider DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
