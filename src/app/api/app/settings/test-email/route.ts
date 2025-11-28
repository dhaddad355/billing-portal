import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toEmail, subject, htmlBody, textBody } = body;

    if (!toEmail || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        { error: "Email address, subject, and body (HTML or text) are required" },
        { status: 400 }
      );
    }

    const apiToken = process.env.POSTMARK_API_TOKEN;
    const fromEmail = process.env.POSTMARK_FROM_EMAIL;

    if (!apiToken || !fromEmail) {
      return NextResponse.json(
        { error: "Postmark is not configured. Please set POSTMARK_API_TOKEN and POSTMARK_FROM_EMAIL environment variables." },
        { status: 500 }
      );
    }

    try {
      const postmark = await import("postmark");
      const client = new postmark.ServerClient(apiToken);

      const result = await client.sendEmail({
        From: fromEmail,
        To: toEmail,
        Subject: subject,
        HtmlBody: htmlBody || undefined,
        TextBody: textBody || htmlBody?.replace(/<[^>]*>/g, "") || "",
      });

      return NextResponse.json({
        success: true,
        messageId: result.MessageID,
        status: result.ErrorCode === 0 ? "sent" : "error",
      });
    } catch (postmarkError) {
      console.error("Postmark error:", postmarkError);
      return NextResponse.json(
        { error: `Failed to send email: ${String(postmarkError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
