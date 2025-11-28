import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - List all Postmark templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiToken = process.env.POSTMARK_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: "Postmark is not configured. Please set POSTMARK_API_TOKEN environment variable." },
        { status: 500 }
      );
    }

    try {
      const postmark = await import("postmark");
      const client = new postmark.ServerClient(apiToken);

      const templates = await client.getTemplates();

      return NextResponse.json({
        templates: templates.Templates.map((t) => ({
          templateId: t.TemplateId,
          name: t.Name,
          alias: t.Alias,
          active: t.Active,
        })),
      });
    } catch (postmarkError) {
      console.error("Postmark error:", postmarkError);
      return NextResponse.json(
        { error: `Failed to fetch templates: ${String(postmarkError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in postmark templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Get or update a specific template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, templateId, subject, htmlBody, textBody } = body;

    const apiToken = process.env.POSTMARK_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: "Postmark is not configured. Please set POSTMARK_API_TOKEN environment variable." },
        { status: 500 }
      );
    }

    try {
      const postmark = await import("postmark");
      const client = new postmark.ServerClient(apiToken);

      if (action === "get" && templateId) {
        const template = await client.getTemplate(templateId);
        return NextResponse.json({
          template: {
            templateId: template.TemplateId,
            name: template.Name,
            alias: template.Alias,
            subject: template.Subject,
            htmlBody: template.HtmlBody,
            textBody: template.TextBody,
            active: template.Active,
          },
        });
      } else if (action === "update" && templateId) {
        const result = await client.editTemplate(templateId, {
          Subject: subject,
          HtmlBody: htmlBody,
          TextBody: textBody,
        });

        return NextResponse.json({
          success: true,
          template: {
            templateId: result.TemplateId,
            name: result.Name,
            alias: result.Alias,
            active: result.Active,
          },
        });
      } else {
        return NextResponse.json(
          { error: "Invalid action or missing templateId" },
          { status: 400 }
        );
      }
    } catch (postmarkError) {
      console.error("Postmark error:", postmarkError);
      return NextResponse.json(
        { error: `Postmark operation failed: ${String(postmarkError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in postmark templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
