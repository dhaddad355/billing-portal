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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();

    const { data: templates, error } = await supabase
      .from("message_templates")
      .select("*")
      .order("template_type")
      .order("channel");

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error in message templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template_type, channel, email_subject, message_body } = body;

    if (!template_type || !channel || !message_body) {
      return NextResponse.json(
        { error: "template_type, channel, and message_body are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    const { data: template, error } = await supabase
      .from("message_templates")
      .update({
        email_subject: channel === "email" ? email_subject : null,
        message_body,
        updated_at: new Date().toISOString(),
        updated_by_user_id: session.user.id,
      })
      .eq("template_type", template_type)
      .eq("channel", channel)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Error in message templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
