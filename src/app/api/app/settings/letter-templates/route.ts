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

// GET /api/app/settings/letter-templates - List all letter templates
export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("letter_templates")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching letter templates:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error("Error in letter templates GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/settings/letter-templates - Create a new letter template
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("letter_templates")
      .insert({
        name: body.name.trim(),
        body: body.body || "",
        is_active: body.is_active !== false,
        created_by: session?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating letter template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error("Error in letter templates POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
