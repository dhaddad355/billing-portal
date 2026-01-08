import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/referrals/[id]/attachments/[attachmentId] - Download an attachment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id, attachmentId } = await params;

    // Get attachment metadata
    const { data: attachment, error: dbError } = await supabase
      .from("referral_attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("referral_id", id)
      .single();

    if (dbError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Get file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from("referral-attachments")
      .download(attachment.storage_path);

    if (storageError || !fileData) {
      console.error("Error downloading file from storage:", storageError);
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": attachment.file_type,
        "Content-Disposition": `attachment; filename="${attachment.file_name}"`,
        "Content-Length": attachment.file_size.toString(),
      },
    });
  } catch (error) {
    console.error("Error in attachment download:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/referrals/[id]/attachments/[attachmentId] - Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id, attachmentId } = await params;

    // Get attachment metadata to get storage path
    const { data: attachment, error: dbError } = await supabase
      .from("referral_attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("referral_id", id)
      .single();

    if (dbError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("referral-attachments")
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue anyway to delete the database record
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("referral_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("referral_id", id);

    if (deleteError) {
      console.error("Error deleting attachment from database:", deleteError);
      return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
    }

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error in attachment delete:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
