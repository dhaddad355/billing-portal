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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceClient();

    const userId = session.user.id;

    // Get current statement
    const { data: statement, error: fetchError } = await supabase
      .from("statements")
      .select("id, payment_status")
      .eq("id", id)
      .single();

    if (fetchError || !statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    const oldPaymentStatus = statement.payment_status;

    // Update payment status to Paid
    const { error: updateError } = await supabase
      .from("statements")
      .update({
        payment_status: "Paid",
        payment_date: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating statement:", updateError);
      return NextResponse.json(
        { error: "Failed to update statement" },
        { status: 500 }
      );
    }

    // Log the event
    await supabase.from("statement_events").insert({
      statement_id: id,
      event_type: "PAYMENT_MARKED_PAID",
      old_status: oldPaymentStatus,
      new_status: "Paid",
      metadata_json: {
        source: "manual",
        marked_by_user_id: userId,
      },
      created_by_user_id: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Statement marked as paid",
    });
  } catch (error) {
    console.error("Error marking statement as paid:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
