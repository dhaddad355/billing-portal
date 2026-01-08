import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

interface GravityFormsPayload {
  id: string;
  form_id: string;
  "5"?: string; // email
  "7"?: string; // account_number
  payment_status?: string;
  payment_amount?: string;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
  currency?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.BILLING_WEBHOOK_API_KEY;

    if (!expectedApiKey) {
      console.error("BILLING_WEBHOOK_API_KEY environment variable not configured");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();

    // Parse request body
    const payload: GravityFormsPayload = await request.json();

    // Extract fields from Gravity Forms payload
    const email = payload["5"]?.trim();
    const accountNumber = payload["7"]?.trim();
    const paymentStatus = payload.payment_status;
    const paymentAmount = payload.payment_amount ? parseFloat(payload.payment_amount) : null;
    const paymentDate = payload.payment_date;
    const paymentMethod = payload.payment_method || null;
    const transactionId = payload.transaction_id;
    const entryId = payload.id;

    // Validate required fields
    if (!accountNumber) {
      return NextResponse.json(
        { success: false, error: "Account number (field 7) is required" },
        { status: 400 }
      );
    }

    if (!paymentStatus) {
      return NextResponse.json(
        { success: false, error: "payment_status is required" },
        { status: 400 }
      );
    }

    // Find the most recent statement for this account number
    const { data: statement, error: findError } = await supabase
      .from("statements")
      .select("id, status, payment_status, account_number_full, person_id")
      .eq("account_number_full", accountNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !statement) {
      console.error("Statement not found for account:", accountNumber, findError);
      return NextResponse.json(
        {
          success: false,
          error: "Statement not found for the provided account number",
          account_number: accountNumber
        },
        { status: 404 }
      );
    }

    // Parse payment date
    let parsedPaymentDate: string | null = null;
    if (paymentDate) {
      const date = new Date(paymentDate);
      if (!isNaN(date.getTime())) {
        parsedPaymentDate = date.toISOString();
      }
    }

    // Update the statement with payment information
    const { error: updateError } = await supabase
      .from("statements")
      .update({
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        payment_date: parsedPaymentDate,
        payment_method: paymentMethod,
        payment_transaction_id: transactionId,
        payment_gateway_entry_id: entryId,
      })
      .eq("id", statement.id);

    if (updateError) {
      console.error("Error updating statement:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update statement" },
        { status: 500 }
      );
    }

    // Log the payment event in statement_events
    await supabase.from("statement_events").insert({
      statement_id: statement.id,
      event_type: "PAYMENT_RECEIVED",
      old_status: statement.payment_status || null,
      new_status: paymentStatus,
      metadata_json: {
        source: "gravity_forms",
        entry_id: entryId,
        form_id: payload.form_id,
        email: email,
        account_number: accountNumber,
        payment_amount: paymentAmount,
        payment_date: parsedPaymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        currency: payload.currency || "USD",
      },
    });

    console.log(`Payment webhook processed: statement=${statement.id}, status=${paymentStatus}, amount=${paymentAmount}, txn=${transactionId}`);

    return NextResponse.json({
      success: true,
      message: "Payment information recorded",
      statement_id: statement.id,
      payment_status: paymentStatus,
    });
  } catch (error) {
    console.error("Error processing billing webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Billing webhook API is active",
    description: "POST to this endpoint with Gravity Forms payment data"
  });
}
