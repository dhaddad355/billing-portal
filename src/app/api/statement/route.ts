import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, STORAGE_BUCKET } from "@/lib/supabase";

interface StatementPayload {
  statement_date?: string;
  person_id?: string;
  account_number_suffix?: number;
  account_number_full?: string;
  cell_phone?: string;
  email_address?: string;
  last_statement_date?: string;
  last_pay_date?: string;
  next_statement_date?: string;
  last_name?: string;
  first_name?: string;
  patient_balance?: number;
  pdf_base64?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeToString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.STATEMENT_INGEST_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();

    // Parse request body - handle both multipart/form-data and JSON
    const contentType = request.headers.get("content-type") || "";
    let payload: StatementPayload;
    let pdfBuffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const personId = normalizeToString(formData.get("person_id"));

      payload = {
        statement_date: formData.get("statement_date")?.toString(),
        person_id: personId,
        account_number_suffix: parseInt(formData.get("account_number_suffix")?.toString() || "0"),
        account_number_full: formData.get("account_number_full")?.toString(),
        cell_phone: formData.get("cell_phone")?.toString(),
        email_address: formData.get("email_address")?.toString(),
        last_statement_date: formData.get("last_statement_date")?.toString(),
        last_pay_date: formData.get("last_pay_date")?.toString(),
        next_statement_date: formData.get("next_statement_date")?.toString(),
        last_name: formData.get("last_name")?.toString(),
        first_name: formData.get("first_name")?.toString(),
        patient_balance: parseFloat(formData.get("patient_balance")?.toString() || "0"),
      };

      const pdfFile = formData.get("statement_pdf") as File | null;
      if (pdfFile) {
        // Validate file type
        if (pdfFile.type !== "application/pdf") {
          return NextResponse.json(
            { success: false, error: "Invalid file type. Only PDF files are accepted." },
            { status: 400 }
          );
        }
        const arrayBuffer = await pdfFile.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        
        // Validate PDF magic bytes (%PDF-)
        if (pdfBuffer.length < 5 || pdfBuffer.toString("utf8", 0, 5) !== "%PDF-") {
          return NextResponse.json(
            { success: false, error: "Invalid PDF file format" },
            { status: 400 }
          );
        }
      }
    } else {
      // JSON payload
      const rawBody = await request.json();

      if (typeof rawBody === "object" && rawBody !== null) {
        const body = rawBody as Record<string, unknown>;
        payload = body as StatementPayload;
        payload.person_id = normalizeToString(body.person_id);
      } else {
        payload = {};
      }

      if (payload.pdf_base64) {
        pdfBuffer = Buffer.from(payload.pdf_base64, "base64");
        
        // Validate PDF magic bytes (%PDF-)
        if (pdfBuffer.length < 5 || pdfBuffer.toString("utf8", 0, 5) !== "%PDF-") {
          return NextResponse.json(
            { success: false, error: "Invalid PDF file format" },
            { status: 400 }
          );
        }
      }
    }

    // Validate required fields
    const normalizedPersonId = payload.person_id?.toLowerCase();

    if (!normalizedPersonId) {
      return NextResponse.json(
        { success: false, error: "person_id is required" },
        { status: 400 }
      );
    }

    if (!UUID_PATTERN.test(normalizedPersonId)) {
      return NextResponse.json(
        { success: false, error: "person_id must be a valid UUID" },
        { status: 400 }
      );
    }

    payload.person_id = normalizedPersonId;

    if (!payload.account_number_full) {
      return NextResponse.json(
        { success: false, error: "account_number_full is required" },
        { status: 400 }
      );
    }

    if (payload.patient_balance === undefined || payload.patient_balance === null) {
      return NextResponse.json(
        { success: false, error: "patient_balance is required" },
        { status: 400 }
      );
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { success: false, error: "PDF file is required" },
        { status: 400 }
      );
    }

    // Parse dates with validation
    const parseAndFormatDate = (dateStr: string | undefined): string | null => {
      if (!dateStr || dateStr.trim() === "") return null;
      
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split("T")[0];
    };

    const statementDate = parseAndFormatDate(payload.statement_date) 
      || new Date().toISOString().split("T")[0];
    
    const lastStatementDate = parseAndFormatDate(payload.last_statement_date);
    const lastPayDate = parseAndFormatDate(payload.last_pay_date);
    const nextStatementDate = parseAndFormatDate(payload.next_statement_date);

    // Build full name
    const fullName = [payload.first_name, payload.last_name]
      .filter(Boolean)
      .join(" ") || `Person ${payload.person_id}`;

    // Upsert person record
    const { error: personError } = await supabase
      .from("persons")
      .upsert(
        {
          person_id: payload.person_id,
          full_name: fullName,
          first_name: payload.first_name || null,
          last_name: payload.last_name || null,
          email_address: payload.email_address || null,
          cell_phone: payload.cell_phone || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "person_id",
        }
      );

    if (personError) {
      console.error("Error upserting person:", personError);
      return NextResponse.json(
        { success: false, error: "Failed to save person data" },
        { status: 500 }
      );
    }

    // Generate unique statement ID and storage path
    const statementId = crypto.randomUUID();
    const pdfPath = `${payload.person_id}/${statementDate}/${statementId}.pdf`;

    // Upload PDF to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Insert statement record
    const { error: statementError } = await supabase
      .from("statements")
      .insert({
        id: statementId,
        person_id: payload.person_id,
        statement_date: statementDate,
        account_number_full: payload.account_number_full,
        account_number_suffix: payload.account_number_suffix || 0,
        last_statement_date: lastStatementDate,
        next_statement_date: nextStatementDate,
        last_pay_date: lastPayDate,
        patient_balance: payload.patient_balance,
        currency_code: "USD",
        pdf_path: pdfPath,
        status: "PENDING",
      });

    if (statementError) {
      console.error("Error inserting statement:", statementError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([pdfPath]);
      return NextResponse.json(
        { success: false, error: "Failed to save statement" },
        { status: 500 }
      );
    }

    // Log statement event
    await supabase.from("statement_events").insert({
      statement_id: statementId,
      event_type: "CREATED",
      new_status: "PENDING",
      metadata_json: {
        source: "api",
        account_number_suffix: payload.account_number_suffix,
      },
    });

    return NextResponse.json({
      success: true,
      statementId,
    });
  } catch (error) {
    console.error("Error processing statement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Statement API is active" });
}
