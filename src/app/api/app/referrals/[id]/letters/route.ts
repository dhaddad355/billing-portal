import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Liquid } from "liquidjs";

interface ExtendedSession {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
  };
}

// Known variables that are auto-populated from referral data
const KNOWN_VARIABLES = [
  "Patient_First_Name",
  "Patient_Last_Name",
  "Patient_Full_Name",
  "Patient_DOB",
  "Patient_Phone",
  "Patient_Email",
  "Provider_First_Name",
  "Provider_Last_Name",
  "Provider_Full_Name",
  "Provider_Degree",
  "Provider_Email",
  "Provider_Phone",
  "Practice_Name",
  "Practice_Address",
  "Practice_City",
  "Practice_State",
  "Practice_Zip",
  "Practice_Phone",
  "Practice_Fax",
  "Referral_Reason",
  "Referral_Notes",
  "Current_Date",
];

// Extract liquid variables from template body
function extractVariables(body: string): string[] {
  const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const variables: Set<string> = new Set();
  let match;
  while ((match = regex.exec(body)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

// GET /api/app/referrals/[id]/letters - List generated letters for a referral
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("generated_letters")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .eq("referral_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generated letters:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ letters: data });
  } catch (error) {
    console.error("Error in letters GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/referrals/[id]/letters - Generate a letter from a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const { id: referralId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.template_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Fetch the referral with related data
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        *,
        providers (
          *,
          practices (*)
        ),
        practices (*)
      `)
      .eq("id", referralId)
      .single();

    if (referralError) {
      if (referralError.code === "PGRST116") {
        return NextResponse.json({ error: "Referral not found" }, { status: 404 });
      }
      console.error("Error fetching referral:", referralError);
      return NextResponse.json({ error: referralError.message }, { status: 500 });
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from("letter_templates")
      .select("*")
      .eq("id", body.template_id)
      .single();

    if (templateError) {
      if (templateError.code === "PGRST116") {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      console.error("Error fetching template:", templateError);
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }

    // Fetch letter settings (header/footer)
    const { data: settings } = await supabase
      .from("letter_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();

    // Parse patient name into first/last
    const nameParts = (referral.patient_full_name || "").split(" ");
    const patientFirstName = nameParts[0] || "";
    const patientLastName = nameParts.slice(1).join(" ") || "";

    // Build known variables context
    const provider = referral.providers;
    const practice = provider?.practices || referral.practices;
    
    const knownContext: Record<string, string> = {
      Patient_First_Name: patientFirstName,
      Patient_Last_Name: patientLastName,
      Patient_Full_Name: referral.patient_full_name || "",
      Patient_DOB: referral.patient_dob ? new Date(referral.patient_dob).toLocaleDateString() : "",
      Patient_Phone: referral.patient_phone || "",
      Patient_Email: referral.patient_email || "",
      Provider_First_Name: provider?.first_name || "",
      Provider_Last_Name: provider?.last_name || "",
      Provider_Full_Name: provider ? `${provider.first_name} ${provider.last_name}` : "",
      Provider_Degree: provider?.degree || "",
      Provider_Email: provider?.email || "",
      Provider_Phone: provider?.phone || "",
      Practice_Name: practice?.name || "",
      Practice_Address: [practice?.address_line1, practice?.address_line2].filter(Boolean).join(", ") || "",
      Practice_City: practice?.city || "",
      Practice_State: practice?.state || "",
      Practice_Zip: practice?.zip_code || "",
      Practice_Phone: practice?.phone || "",
      Practice_Fax: practice?.fax || "",
      Referral_Reason: referral.referral_reason || "",
      Referral_Notes: referral.notes || "",
      Current_Date: new Date().toLocaleDateString(),
    };

    // Merge custom variables from request
    const customVariables: Record<string, string> = body.custom_variables || {};
    const mergedContext = { ...knownContext, ...customVariables };

    // Render template using Liquid
    const liquid = new Liquid();
    let mergedBody: string;
    try {
      mergedBody = await liquid.parseAndRender(template.body, mergedContext);
    } catch (renderError) {
      console.error("Error rendering template:", renderError);
      return NextResponse.json({ error: "Failed to render template" }, { status: 500 });
    }

    // Combine header, body, and footer
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { margin-bottom: 30px; }
          .body { margin-bottom: 30px; }
          .footer { margin-top: 30px; }
          strong, b { font-weight: bold; }
          u { text-decoration: underline; }
          p { margin: 0 0 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">${settings?.header_html || ""}</div>
        <div class="body">${mergedBody}</div>
        <div class="footer">${settings?.footer_html || ""}</div>
      </body>
      </html>
    `;

    // Generate unique storage path
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = `letters/${referralId}/${timestamp}.html`;

    // Upload HTML to storage (PDF generation will be done client-side)
    const { error: uploadError } = await supabase.storage
      .from("statements")
      .upload(storagePath, fullHtml, {
        contentType: "text/html",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading letter:", uploadError);
      return NextResponse.json({ error: "Failed to save letter" }, { status: 500 });
    }

    // Save generated letter record
    const { data: generatedLetter, error: insertError } = await supabase
      .from("generated_letters")
      .insert({
        referral_id: referralId,
        template_id: template.id,
        template_name: template.name,
        merged_html: fullHtml,
        storage_path: storagePath,
        custom_variables: customVariables,
        created_by: session?.user?.id || null,
      })
      .select(`
        *,
        users (id, display_name, email)
      `)
      .single();

    if (insertError) {
      console.error("Error saving generated letter:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Add a note to the referral timeline
    await supabase.from("referral_notes").insert({
      referral_id: referralId,
      user_id: session?.user?.id || null,
      note: `Generated letter: ${template.name}`,
      note_type: "system",
      visibility: "public",
    });

    return NextResponse.json({ 
      letter: generatedLetter,
      html: fullHtml,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in letters POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/referrals/[id]/letters/preview - Preview template variables
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    await params; // Validate params exist
    const body = await request.json();

    if (!body.template_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from("letter_templates")
      .select("*")
      .eq("id", body.template_id)
      .single();

    if (templateError) {
      if (templateError.code === "PGRST116") {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      console.error("Error fetching template:", templateError);
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }

    // Extract all variables from template
    const allVariables = extractVariables(template.body);
    
    // Separate known and unknown variables
    const knownVars = allVariables.filter((v) => KNOWN_VARIABLES.includes(v));
    const unknownVars = allVariables.filter((v) => !KNOWN_VARIABLES.includes(v));

    return NextResponse.json({
      template_name: template.name,
      all_variables: allVariables,
      known_variables: knownVars,
      unknown_variables: unknownVars,
    });
  } catch (error) {
    console.error("Error in letters PATCH (preview):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
