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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statementId = params.id;
    const supabase = getServiceClient();

    // Get statement
    const { data: statement, error: fetchError } = await supabase
      .from("statements")
      .select("id, status")
      .eq("id", statementId)
      .single();

    if (fetchError || !statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    if (statement.status !== "PENDING") {
      return NextResponse.json(
        { error: "Statement is not in PENDING status" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update statement
    const { error: updateError } = await supabase
      .from("statements")
      .update({
        status: "REJECTED",
        rejected_at: now,
        rejected_by_user_id: session.user.id,
      })
      .eq("id", statementId);

    if (updateError) {
      console.error("Error updating statement:", updateError);
      return NextResponse.json(
        { error: "Failed to update statement" },
        { status: 500 }
      );
    }

    // Log status change event
    await supabase.from("statement_events").insert({
      statement_id: statementId,
      event_type: "STATUS_CHANGE",
      old_status: "PENDING",
      new_status: "REJECTED",
      created_by_user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error rejecting statement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
