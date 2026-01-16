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

// GET /api/inbound-referrals - List all inbound referrals
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || searchParams.get("page_size") || "20");

    let query = supabase
      .from("inbound_referrals")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filter by status (PENDING, CONVERTED, REJECTED)
    if (status) {
      query = query.eq("status", status);
    }

    // Search by patient name
    if (search) {
      query = query.or(`patient_full_name.ilike.%${search}%,patient_first_name.ilike.%${search}%,patient_last_name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching inbound referrals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inbound_referrals: data,
      total: count || 0,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error in inbound-referrals GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
