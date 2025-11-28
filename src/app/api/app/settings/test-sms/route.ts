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
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables." },
        { status: 500 }
      );
    }

    try {
      const twilio = await import("twilio");
      const client = twilio.default(accountSid, authToken);

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber,
      });

      return NextResponse.json({
        success: true,
        messageId: result.sid,
        status: result.status,
      });
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      return NextResponse.json(
        { error: `Failed to send SMS: ${String(twilioError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test SMS API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
