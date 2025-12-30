import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { parseDateOfBirth, compareDates } from "@/lib/utils";

interface VerifyDobRequest {
  short_code: string;
  dob: string;
}

interface StatementWithPerson {
  id: string;
  person_id: string;
  status: string;
  first_view_at: string | null;
  view_count: number;
  persons: { date_of_birth: string | null } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyDobRequest = await request.json();

    if (!body.short_code || !body.dob) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Find statement by short code with person data
    const { data, error } = await supabase
      .from("statements")
      .select(`
        id,
        person_id,
        status,
        first_view_at,
        view_count,
        persons (
          date_of_birth
        )
      `)
      .eq("short_code", body.short_code)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "INVALID_CODE" },
        { status: 404 }
      );
    }

    const statement = data as unknown as StatementWithPerson;

    if (statement.status !== "SENT") {
      return NextResponse.json(
        { success: false, error: "STATEMENT_UNAVAILABLE" },
        { status: 400 }
      );
    }

    // Parse and compare DOB
    const inputDob = parseDateOfBirth(body.dob);
    if (!inputDob) {
      return NextResponse.json(
        { success: false, error: "INVALID_DOB_FORMAT" },
        { status: 400 }
      );
    }

    const storedDobStr = statement.persons?.date_of_birth;
    if (!storedDobStr) {
      // No DOB on file - deny access for security
      console.warn(`No DOB on file for person ${statement.person_id}, denying access`);
      return NextResponse.json(
        { success: false, error: "VERIFICATION_UNAVAILABLE" },
        { status: 400 }
      );
    }
    
    const storedDob = new Date(storedDobStr);
    if (!compareDates(inputDob, storedDob)) {
      return NextResponse.json(
        { success: false, error: "DOB_MISMATCH" },
        { status: 401 }
      );
    }

    // Update view tracking
    const now = new Date().toISOString();
    await supabase
      .from("statements")
      .update({
        first_view_at: statement.first_view_at || now,
        last_view_at: now,
        view_count: (statement.view_count || 0) + 1,
      })
      .eq("id", statement.id);

    // Log view event
    await supabase.from("statement_events").insert({
      statement_id: statement.id,
      event_type: "VIEWED",
      metadata_json: {
        view_count: (statement.view_count || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error verifying DOB:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
