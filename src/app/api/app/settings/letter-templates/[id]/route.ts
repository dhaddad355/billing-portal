import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/app/settings/letter-templates/[id] - Get a specific letter template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("letter_templates")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      console.error("Error fetching letter template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("Error in letter template GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/settings/letter-templates/[id] - Update a letter template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "Template name cannot be empty" }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    if (body.body !== undefined) updateData.body = body.body;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from("letter_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      console.error("Error updating letter template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("Error in letter template PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/app/settings/letter-templates/[id] - Delete a letter template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { error } = await supabase
      .from("letter_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting letter template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in letter template DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
