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

// GET /api/app/referrals/[id] - Get a specific referral with notes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const { id } = params;

    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        *,
        providers (
          *,
          practices (*)
        ),
        practices (*)
      `)
      .eq("id", id)
      .single();

    if (referralError) {
      if (referralError.code === "PGRST116") {
        return NextResponse.json({ error: "Referral not found" }, { status: 404 });
      }
      console.error("Error fetching referral:", referralError);
      return NextResponse.json({ error: referralError.message }, { status: 500 });
    }

    // Get notes for this referral
    const { data: notes, error: notesError } = await supabase
      .from("referral_notes")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .eq("referral_id", id)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Error fetching referral notes:", notesError);
    }

    return NextResponse.json({
      referral,
      notes: notes || [],
    });
  } catch (error) {
    console.error("Error in referral GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/app/referrals/[id] - Update a referral
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const { id } = params;
    const body = await request.json();

    // Get current referral to track status changes
    const { data: currentReferral } = await supabase
      .from("referrals")
      .select("status, sub_status")
      .eq("id", id)
      .single();

    const updateData: Record<string, unknown> = {};

    // Only include fields that are provided
    if (body.provider_id !== undefined) updateData.provider_id = body.provider_id;
    if (body.practice_id !== undefined) updateData.practice_id = body.practice_id;
    if (body.patient_full_name !== undefined) updateData.patient_full_name = body.patient_full_name;
    if (body.patient_dob !== undefined) updateData.patient_dob = body.patient_dob;
    if (body.patient_phone !== undefined) updateData.patient_phone = body.patient_phone;
    if (body.patient_email !== undefined) updateData.patient_email = body.patient_email;
    if (body.referral_reason !== undefined) updateData.referral_reason = body.referral_reason;
    if (body.referral_reason_other !== undefined) updateData.referral_reason_other = body.referral_reason_other;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.scheduling_preference !== undefined) updateData.scheduling_preference = body.scheduling_preference;
    if (body.communication_preference !== undefined) updateData.communication_preference = body.communication_preference;
    if (body.communication_value !== undefined) updateData.communication_value = body.communication_value;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.sub_status !== undefined) updateData.sub_status = body.sub_status;

    const { data, error } = await supabase
      .from("referrals")
      .update(updateData)
      .eq("id", id)
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
      console.error("Error updating referral:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create status change note if status or sub_status changed
    if (currentReferral) {
      const statusChanged = body.status !== undefined && body.status !== currentReferral.status;
      const subStatusChanged = body.sub_status !== undefined && body.sub_status !== currentReferral.sub_status;

      if (statusChanged || subStatusChanged) {
        await supabase.from("referral_notes").insert({
          referral_id: id,
          user_id: session?.user?.id || null,
          note: `Status updated${statusChanged ? ` from ${currentReferral.status} to ${body.status}` : ""}${subStatusChanged ? ` (sub-status: ${currentReferral.sub_status} → ${body.sub_status})` : ""}`,
          note_type: "status_change",
          previous_status: statusChanged ? currentReferral.status : null,
          new_status: statusChanged ? body.status : null,
          previous_sub_status: subStatusChanged ? currentReferral.sub_status : null,
          new_sub_status: subStatusChanged ? body.sub_status : null,
        });
      }
    }

    return NextResponse.json({ referral: data });
  } catch (error) {
    console.error("Error in referral PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
