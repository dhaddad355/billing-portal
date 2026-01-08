import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SendReminderRequestBody {
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

function replaceTemplatePlaceholders(
  template: string,
  data: {
    patient_name: string;
    balance_amount: string;
    view_url: string;
  }
): string {
  return template
    .replace(/\{\{patient_name\}\}/g, data.patient_name)
    .replace(/\{\{balance_amount\}\}/g, data.balance_amount)
    .replace(/\{\{view_url\}\}/g, data.view_url);
}

async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
    const body: SendReminderRequestBody = await request.json().catch(() => ({}));
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

    // Only allow reminders for SENT statements
    if (statement.status !== "SENT") {
      return NextResponse.json(
        { error: "Statement must be in SENT status to send a reminder" },
        { status: 400 }
      );
    }

    if (!statement.short_code) {
      return NextResponse.json(
        { error: "Statement has no short code - it must be sent first" },
        { status: 400 }
      );
    }

    // Get reminder templates
    const { data: templates, error: templatesError } = await supabase
      .from("message_templates")
      .select("*")
      .eq("template_type", "reminder");

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      return NextResponse.json(
        { error: "Failed to fetch message templates" },
        { status: 500 }
      );
    }

    const smsTemplate = templates?.find((t) => t.channel === "sms");
    const emailTemplate = templates?.find((t) => t.channel === "email");

    const now = new Date().toISOString();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "app.mylei.com";
    const viewUrl = `https://${baseUrl}/view/${statement.short_code}`;

    const templateData = {
      patient_name: statement.persons?.full_name || "Valued Patient",
      balance_amount: `$${statement.patient_balance.toFixed(2)}`,
      view_url: viewUrl,
    };

    const messageResults: Array<{
      channel: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    // Send SMS reminder
    if (sendSms && statement.persons?.cell_phone && smsTemplate) {
      const smsMessage = replaceTemplatePlaceholders(
        smsTemplate.message_body,
        templateData
      );
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

    // Send email reminder
    if (sendEmail_ && statement.persons?.email_address && emailTemplate) {
      const emailSubject = replaceTemplatePlaceholders(
        emailTemplate.email_subject || "Reminder from Laser Eye Institute",
        templateData
      );
      const emailBody = replaceTemplatePlaceholders(
        emailTemplate.message_body,
        templateData
      );
      const emailResult = await sendEmail(
        statement.persons.email_address,
        emailSubject,
        emailBody
      );
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

    // Log reminder event
    await supabase.from("statement_events").insert({
      statement_id: statementId,
      event_type: "REMINDER_SENT",
      metadata_json: {
        messages_sent: messageResults,
      },
      created_by_user_id: session.user.id,
    });

    return NextResponse.json({
      success: true,
      viewUrl,
      messageResults,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
