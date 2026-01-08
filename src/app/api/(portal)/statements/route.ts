import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const supabase = getServiceClient();

    // Get total count
    const { count } = await supabase
      .from("statements")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    // Get statements with person data
    const { data: statements, error } = await supabase
      .from("statements")
      .select(`
        id,
        person_id,
        statement_date,
        account_number_full,
        account_number_suffix,
        last_statement_date,
        next_statement_date,
        last_pay_date,
        patient_balance,
        currency_code,
        short_code,
        view_count,
        status,
        created_at,
        sent_at,
        persons (
          full_name,
          first_name,
          last_name,
          email_address,
          cell_phone
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error("Error fetching statements:", error);
      return NextResponse.json(
        { error: "Failed to fetch statements" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      statements,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error in statements API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
