import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, STORAGE_BUCKET } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const shortcode = params.shortcode;
    const supabase = getServiceClient();

    // Find statement by short code
    const { data: statement, error } = await supabase
      .from("statements")
      .select("id, pdf_path, status")
      .eq("short_code", shortcode)
      .single();

    if (error || !statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    if (statement.status !== "SENT") {
      return NextResponse.json(
        { error: "Statement is not available" },
        { status: 400 }
      );
    }

    // Generate signed URL for PDF download (valid for 5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(statement.pdf_path, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate PDF download link" },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
