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

// GET /api/referrals/[id]/notes - Get all notes for a referral
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("referral_notes")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .eq("referral_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referral notes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    console.error("Error in referral notes GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/referrals/[id]/notes - Add a note to a referral
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const { id } = await params;
    const body = await request.json();

    if (!body.note || body.note.trim() === "") {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    // Validate visibility if provided
    const visibility = body.visibility || "public";
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json({ error: "Invalid visibility value" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("referral_notes")
      .insert({
        referral_id: id,
        user_id: session?.user?.id || null,
        note: body.note.trim(),
        note_type: "manual",
        visibility: visibility,
      })
      .select(`
        *,
        users (id, display_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating referral note:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (error) {
    console.error("Error in referral notes POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
