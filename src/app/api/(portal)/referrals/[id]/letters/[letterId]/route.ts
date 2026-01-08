import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/referrals/[id]/letters/[letterId] - Download a generated letter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; letterId: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id: referralId, letterId } = await params;

    // Fetch the generated letter
    const { data: letter, error: letterError } = await supabase
      .from("generated_letters")
      .select("*")
      .eq("id", letterId)
      .eq("referral_id", referralId)
      .single();

    if (letterError) {
      if (letterError.code === "PGRST116") {
        return NextResponse.json({ error: "Letter not found" }, { status: 404 });
      }
      console.error("Error fetching letter:", letterError);
      return NextResponse.json({ error: letterError.message }, { status: 500 });
    }

    // Return the merged HTML for client-side PDF generation
    return NextResponse.json({
      letter,
      html: letter.merged_html,
    });
  } catch (error) {
    console.error("Error in letter GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/referrals/[id]/letters/[letterId] - Delete a generated letter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; letterId: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id: referralId, letterId } = await params;

    // Fetch the letter first to get storage path
    const { data: letter, error: fetchError } = await supabase
      .from("generated_letters")
      .select("storage_path")
      .eq("id", letterId)
      .eq("referral_id", referralId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Letter not found" }, { status: 404 });
      }
      console.error("Error fetching letter:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete from storage
    if (letter.storage_path) {
      await supabase.storage
        .from("statements")
        .remove([letter.storage_path]);
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from("generated_letters")
      .delete()
      .eq("id", letterId)
      .eq("referral_id", referralId);

    if (deleteError) {
      console.error("Error deleting letter:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in letter DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
