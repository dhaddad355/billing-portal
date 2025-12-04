import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateShortCode } from "@/lib/utils";

interface SendRequestBody {
  send_sms?: boolean;
  send_email?: boolean;
}

interface ExtendedSession {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
  };
}

async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: String(error) };
  }
}

async function sendEmail(
  toEmail: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiToken = process.env.POSTMARK_API_TOKEN;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;

  if (!apiToken || !fromEmail) {
    console.warn("Postmark not configured, skipping email");
    return { success: false, error: "Postmark not configured" };
  }

  try {
    const postmark = await import("postmark");
    const client = new postmark.ServerClient(apiToken);
    
    const result = await client.sendEmail({
      From: fromEmail,
      To: toEmail,
      Subject: subject,
      HtmlBody: body,
      TextBody: body.replace(/<[^>]*>/g, ""),
    });

    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const statementId = id;
    const body: SendRequestBody = await request.json().catch(() => ({}));
    const sendSms = body.send_sms !== false;
    const sendEmail_ = body.send_email !== false;

    const supabase = getServiceClient();

    // Get statement with person data
    const { data: statement, error: fetchError } = await supabase
      .from("statements")
      .select(`
        *,
        persons (
          full_name,
          email_address,
          cell_phone
        )
      `)
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

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      const { data: existing } = await supabase
        .from("statements")
        .select("id")
        .eq("short_code", shortCode)
        .single();
      
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique short code" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const viewUrl = `https://bill.lasereyeinstitute.com/view/${shortCode}`;

    // Update statement
    const { error: updateError } = await supabase
      .from("statements")
      .update({
        short_code: shortCode,
        short_code_created_at: now,
        status: "SENT",
        sent_at: now,
        sent_by_user_id: session.user.id,
      })
      .eq("id", statementId);

    if (updateError) {
      console.error("Error updating statement:", updateError);
      return NextResponse.json(
        { error: "Failed to update statement" },
        { status: 500 }
      );
    }

    const messageResults: Array<{ channel: string; success: boolean; messageId?: string; error?: string }> = [];

    // Send SMS if cell phone available
    if (sendSms && statement.persons?.cell_phone) {
      const smsMessage = `Laser Eye Institute: Your statement is ready. View & pay: ${viewUrl}`;
      const smsResult = await sendSMS(statement.persons.cell_phone, smsMessage);
      messageResults.push({ channel: "SMS", ...smsResult });

      // Log SMS message
      await supabase.from("messages").insert({
        statement_id: statementId,
        person_id: statement.person_id,
        channel: "SMS",
        to_address: statement.persons.cell_phone,
        body_preview: smsMessage,
        provider: "twilio",
        provider_message_id: smsResult.messageId,
        status: smsResult.success ? "SENT" : "FAILED",
        error_message: smsResult.error,
        sent_at: smsResult.success ? now : null,
        created_by_user_id: session.user.id,
      });
    }

    // Send email if email address available
    if (sendEmail_ && statement.persons?.email_address) {
      const emailSubject = "Your statement from Laser Eye Institute";
      const emailBody = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Laser Eye Institute</h2>
            <p>Dear ${statement.persons.full_name || "Valued Patient"},</p>
            <p>Your statement is ready for review. The balance due is <strong>$${statement.patient_balance.toFixed(2)}</strong>.</p>
            <p>
              <a href="${viewUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                View & Pay Statement
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280;">${viewUrl}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated message from Laser Eye Institute. 
              Please do not reply directly to this email.
            </p>
          </body>
        </html>
      `;
      const emailResult = await sendEmail(statement.persons.email_address, emailSubject, emailBody);
      messageResults.push({ channel: "EMAIL", ...emailResult });

      // Log email message
      await supabase.from("messages").insert({
        statement_id: statementId,
        person_id: statement.person_id,
        channel: "EMAIL",
        to_address: statement.persons.email_address,
        subject: emailSubject,
        body_preview: emailBody.substring(0, 500),
        provider: "postmark",
        provider_message_id: emailResult.messageId,
        status: emailResult.success ? "SENT" : "FAILED",
        error_message: emailResult.error,
        sent_at: emailResult.success ? now : null,
        created_by_user_id: session.user.id,
      });
    }

    // Log status change event
    await supabase.from("statement_events").insert({
      statement_id: statementId,
      event_type: "STATUS_CHANGE",
      old_status: "PENDING",
      new_status: "SENT",
      metadata_json: {
        short_code: shortCode,
        messages_sent: messageResults,
      },
      created_by_user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
      shortCode,
      viewUrl,
      messageResults,
    });
  } catch (error) {
    console.error("Error sending statement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
