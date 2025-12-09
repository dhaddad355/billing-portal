import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/app/quotes/[id] - Get a specific quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        quote_discounts (*),
        users (id, email, display_name)
      `)
      .eq("id", id)
      .single();

    if (quoteError) {
      if (quoteError.code === "PGRST116") {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }
      console.error("Error fetching quote:", quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Fetch selected add-ons
    const { data: addons, error: addonsError } = await supabase
      .from("quote_selected_addons")
      .select("*")
      .eq("quote_id", id);

    if (addonsError) {
      console.error("Error fetching quote add-ons:", addonsError);
    }

    return NextResponse.json({
      quote: {
        ...quote,
        selected_addons: addons || [],
      },
    });
  } catch (error) {
    console.error("Error in quote GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/quotes/[id] - Update a quote
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;
    const body = await request.json();

    // Update the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .update({
        patient_name: body.patient_name,
        patient_mrn: body.patient_mrn,
        right_eye_refractive_error: body.right_eye_refractive_error || null,
        right_eye_has_astigmatism: body.right_eye_has_astigmatism || null,
        right_eye_treatment: body.right_eye_treatment || null,
        right_eye_price: body.right_eye_price || null,
        left_eye_refractive_error: body.left_eye_refractive_error || null,
        left_eye_has_astigmatism: body.left_eye_has_astigmatism || null,
        left_eye_treatment: body.left_eye_treatment || null,
        left_eye_price: body.left_eye_price || null,
        subtotal: body.subtotal,
        bilateral_discount_amount: body.bilateral_discount_amount || 0,
        discount_id: body.discount_id || null,
        discount_percentage: body.discount_percentage || 0,
        discount_amount: body.discount_amount || 0,
        addons_total: body.addons_total || 0,
        total_amount: body.total_amount,
        scheduling_deposit: body.scheduling_deposit,
        balance_due: body.balance_due,
      })
      .eq("id", id)
      .select(`
        *,
        quote_discounts (*),
        users (id, email, display_name)
      `)
      .single();

    if (quoteError) {
      console.error("Error updating quote:", quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Update selected add-ons: delete existing and insert new ones
    if (body.selected_addons !== undefined) {
      // Delete existing add-ons
      await supabase
        .from("quote_selected_addons")
        .delete()
        .eq("quote_id", id);

      // Insert new add-ons
      if (body.selected_addons.length > 0) {
        const addonsToInsert = body.selected_addons.map((addon: { addon_id: string; addon_name: string; addon_price: number }) => ({
          quote_id: id,
          addon_id: addon.addon_id,
          addon_name: addon.addon_name,
          addon_price: addon.addon_price,
        }));

        await supabase
          .from("quote_selected_addons")
          .insert(addonsToInsert);
      }
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Error in quote PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/app/quotes/[id] - Delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting quote:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in quote DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
