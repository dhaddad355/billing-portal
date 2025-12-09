import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ExtendedSession {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
  };
}

// GET /api/app/quotes - List all quotes
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("quotes")
      .select(`
        *,
        quote_discounts (*),
        users (id, email, display_name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Search by patient name or MRN
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_mrn.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching quotes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      quotes: data,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in quotes GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/quotes - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const body = await request.json();

    const userId = session?.user?.id || null;

    // Validate required fields
    if (!body.patient_name || !body.patient_mrn) {
      return NextResponse.json(
        { error: "Patient name and MRN are required" },
        { status: 400 }
      );
    }

    // Insert the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
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
        created_by: userId,
      })
      .select(`
        *,
        quote_discounts (*),
        users (id, email, display_name)
      `)
      .single();

    if (quoteError) {
      console.error("Error creating quote:", quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Insert selected add-ons if provided
    if (body.selected_addons && body.selected_addons.length > 0) {
      const addonsToInsert = body.selected_addons.map((addon: { addon_id: string; addon_name: string; addon_price: number }) => ({
        quote_id: quote.id,
        addon_id: addon.addon_id,
        addon_name: addon.addon_name,
        addon_price: addon.addon_price,
      }));

      const { error: addonsError } = await supabase
        .from("quote_selected_addons")
        .insert(addonsToInsert);

      if (addonsError) {
        console.error("Error adding quote add-ons:", addonsError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error("Error in quotes POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
