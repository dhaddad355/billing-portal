import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, STORAGE_BUCKET } from "@/lib/supabase";

interface StatementPayload {
  statement_date?: string;
  person_id?: number;
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

export async function POST(request: NextRequest) {
  // Extract request metadata early for logging
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Helper function to log import attempts
  const logImport = async (
    supabase: ReturnType<typeof getServiceClient>,
    accountNumber: string | undefined,
    personId: number | undefined,
    statementId: string | null,
    status: "SUCCESS" | "FAILED",
    errorMessage?: string
  ) => {
    try {
      await supabase.from("import_logs").insert({
        account_number: accountNumber || "unknown",
        statement_id: statementId,
        person_id: personId || null,
        status,
        error_message: errorMessage || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (logError) {
      // Log import logging failures but don't fail the main request
      console.error("Failed to log import:", logError);
    }
  };
  
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
      
      payload = {
        statement_date: formData.get("statement_date")?.toString(),
        person_id: parseInt(formData.get("person_id")?.toString() || "0"),
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
          await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Invalid file type");
          return NextResponse.json(
            { success: false, error: "Invalid file type. Only PDF files are accepted." },
            { status: 400 }
          );
        }
        const arrayBuffer = await pdfFile.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        
        // Validate PDF magic bytes (%PDF-)
        if (pdfBuffer.length < 5 || pdfBuffer.toString("utf8", 0, 5) !== "%PDF-") {
          await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Invalid PDF file format");
          return NextResponse.json(
            { success: false, error: "Invalid PDF file format" },
            { status: 400 }
          );
        }
      }
    } else {
      // JSON payload
      payload = await request.json();
      
      if (payload.pdf_base64) {
        pdfBuffer = Buffer.from(payload.pdf_base64, "base64");
        
        // Validate PDF magic bytes (%PDF-)
        if (pdfBuffer.length < 5 || pdfBuffer.toString("utf8", 0, 5) !== "%PDF-") {
          const supabase = getServiceClient();
          await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Invalid PDF file format");
          return NextResponse.json(
            { success: false, error: "Invalid PDF file format" },
            { status: 400 }
          );
        }
      }
    }

    // Validate required fields
    if (!payload.person_id) {
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "person_id is required");
      return NextResponse.json(
        { success: false, error: "person_id is required" },
        { status: 400 }
      );
    }

    if (!payload.account_number_full) {
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "account_number_full is required");
      return NextResponse.json(
        { success: false, error: "account_number_full is required" },
        { status: 400 }
      );
    }

    if (payload.patient_balance === undefined || payload.patient_balance === null) {
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "patient_balance is required");
      return NextResponse.json(
        { success: false, error: "patient_balance is required" },
        { status: 400 }
      );
    }

    if (!pdfBuffer) {
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "PDF file is required");
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
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Failed to save person data");
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
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Failed to upload PDF");
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
      await logImport(supabase, payload.account_number_full, payload.person_id, null, "FAILED", "Failed to save statement");
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

    // Log the successful import for history tracking
    await logImport(supabase, payload.account_number_full, payload.person_id, statementId, "SUCCESS");

    return NextResponse.json({
      success: true,
      statementId,
    });
  } catch (error) {
    console.error("Error processing statement:", error);
    // Try to log failed import in catch block
    try {
      const supabase = getServiceClient();
      await supabase.from("import_logs").insert({
        account_number: "unknown",
        statement_id: null,
        person_id: null,
        status: "FAILED",
        error_message: "Internal server error",
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (logError) {
      console.error("Failed to log import error:", logError);
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Statement API is active" });
}
