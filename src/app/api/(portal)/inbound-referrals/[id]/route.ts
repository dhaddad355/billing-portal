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

// GET /api/inbound-referrals/[id] - Get a single inbound referral
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("inbound_referrals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching inbound referral:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ inbound_referral: data });
  } catch (error) {
    console.error("Error in inbound-referral GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/inbound-referrals/[id]/convert - Convert to regular referral
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const body = await request.json();

    // Get user ID from session
    let userId = null;
    if (session?.user?.id && session.user.id.trim() !== "") {
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (userExists) {
        userId = session.user.id;
      }
    }

    // Get the inbound referral
    const { data: inboundReferral, error: fetchError } = await supabase
      .from("inbound_referrals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !inboundReferral) {
      return NextResponse.json(
        { error: "Inbound referral not found" },
        { status: 404 }
      );
    }

    // Check if already converted
    if (inboundReferral.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Referral already converted" },
        { status: 400 }
      );
    }

    // Create the normalized referral with validated/corrected data from the body
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .insert({
        provider_id: body.provider_id || null,
        practice_id: body.practice_id || null,
        patient_full_name: body.patient_full_name,
        patient_dob: body.patient_dob || null,
        patient_phone: body.patient_phone || null,
        patient_email: body.patient_email || null,
        referral_reason: body.referral_reason || null,
        referral_reason_other: body.referral_reason_other || null,
        notes: body.notes || null,
        scheduling_preference: body.scheduling_preference || null,
        communication_preference: body.communication_preference || null,
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

    if (referralError) {
      console.error("Error creating referral:", referralError);
      return NextResponse.json(
        { error: referralError.message },
        { status: 500 }
      );
    }

    // Update inbound referral status
    const { error: updateError } = await supabase
      .from("inbound_referrals")
      .update({
        status: "CONVERTED",
        converted_referral_id: referral.id,
        converted_at: new Date().toISOString(),
        converted_by: userId,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating inbound referral:", updateError);
      // Don't fail the request, as the referral was created successfully
    }

    // Create initial system note
    await supabase.from("referral_notes").insert({
      referral_id: referral.id,
      user_id: userId,
      note: `Converted from inbound referral queue (ID: ${id})`,
      note_type: "system",
    });

    return NextResponse.json({
      success: true,
      referral,
      message: "Referral converted successfully",
    });
  } catch (error) {
    console.error("Error in inbound-referral convert POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/inbound-referrals/[id] - Reject/delete inbound referral
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason");

    // Get user ID from session
    let userId = null;
    if (session?.user?.id && session.user.id.trim() !== "") {
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (userExists) {
        userId = session.user.id;
      }
    }

    // Update status to rejected instead of deleting
    const { error } = await supabase
      .from("inbound_referrals")
      .update({
        status: "REJECTED",
        rejection_reason: reason || "Rejected by staff",
        rejected_at: new Date().toISOString(),
        rejected_by: userId,
      })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting inbound referral:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Inbound referral rejected",
    });
  } catch (error) {
    console.error("Error in inbound-referral DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
