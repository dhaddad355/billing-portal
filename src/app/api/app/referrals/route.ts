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

// GET /api/app/referrals - List all referrals with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const subStatus = searchParams.get("sub_status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("page_size") || "20");

    let query = supabase
      .from("referrals")
      .select(`
        *,
        providers (
          *,
          practices (*)
        ),
        practices (*)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (subStatus) {
      query = query.eq("sub_status", subStatus);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching referrals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      referrals: data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error in referrals GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const body = await request.json();

    // Get user ID from session - validate it's a proper UUID and exists
    let userId = null;
    if (session?.user?.id && session.user.id.trim() !== "") {
      // Verify the user exists in the database before using the ID
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (userExists) {
        userId = session.user.id;
      }
    }

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        provider_id: body.provider_id || null,
        practice_id: body.practice_id || null,
        patient_full_name: body.patient_full_name,
        patient_dob: body.patient_dob,
        patient_phone: body.patient_phone || null,
        patient_email: body.patient_email || null,
        referral_reason: body.referral_reason,
        referral_reason_other: body.referral_reason_other || null,
        notes: body.notes || null,
        scheduling_preference: body.scheduling_preference,
        communication_preference: body.communication_preference,
        communication_value: body.communication_value || null,
        status: "OPEN",
        sub_status: "Scheduling",
        created_by: userId,
      })
      .select(`
        *,
        providers (
          *,
          practices (*)
        ),
        practices (*)
      `)
      .single();

    if (error) {
      console.error("Error creating referral:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create initial system note
    await supabase.from("referral_notes").insert({
      referral_id: data.id,
      user_id: userId,
      note: "Referral created",
      note_type: "system",
    });

    return NextResponse.json({ referral: data }, { status: 201 });
  } catch (error) {
    console.error("Error in referrals POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
