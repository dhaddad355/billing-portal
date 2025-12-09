import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/app/quotes/settings/discounts - Create a new discount
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    if (!body.name || body.percentage === undefined) {
      return NextResponse.json(
        { error: "Name and percentage are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("quote_discounts")
      .insert({
        name: body.name,
        percentage: body.percentage,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating discount:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ discount: data }, { status: 201 });
  } catch (error) {
    console.error("Error in discount POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/quotes/settings/discounts - Update a discount
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.percentage !== undefined) updateData.percentage = body.percentage;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from("quote_discounts")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating discount:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ discount: data });
  } catch (error) {
    console.error("Error in discount PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/app/quotes/settings/discounts - Delete a discount
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("quote_discounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting discount:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in discount DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
