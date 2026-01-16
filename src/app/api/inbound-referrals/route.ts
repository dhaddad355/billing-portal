import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

interface InboundReferralPayload {
  patient_full_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_phone?: string;
  patient_email?: string;
  referral_reason?: string;
  referral_reason_other?: string;
  notes?: string;
  scheduling_preference?: string;
  provider_name?: string;
  practice_name?: string;
  provider_email?: string;
  provider_phone?: string;
  practice_phone?: string;
  practice_fax?: string;
  communication_preference?: string;
  communication_value?: string;
  [key: string]: unknown; // Allow additional fields
}

// Normalize string values - convert all string values to proper strings or null
const normalizeString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  
  if (typeof value === "boolean") {
    return value.toString();
  }
  
  return null;
};

// POST /api/inbound-referrals - Receive new referral from website
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.REFERRAL_INGEST_API_KEY;

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();

    // Parse request body as JSON
    const rawBody = await request.json();
    
    if (typeof rawBody !== "object" || rawBody === null) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = rawBody as InboundReferralPayload;

    // Store all string fields, normalizing values
    const inboundReferralData = {
      patient_full_name: normalizeString(body.patient_full_name),
      patient_first_name: normalizeString(body.patient_first_name),
      patient_last_name: normalizeString(body.patient_last_name),
      patient_dob: normalizeString(body.patient_dob),
      patient_phone: normalizeString(body.patient_phone),
      patient_email: normalizeString(body.patient_email),
      referral_reason: normalizeString(body.referral_reason),
      referral_reason_other: normalizeString(body.referral_reason_other),
      notes: normalizeString(body.notes),
      scheduling_preference: normalizeString(body.scheduling_preference),
      provider_name: normalizeString(body.provider_name),
      practice_name: normalizeString(body.practice_name),
      provider_email: normalizeString(body.provider_email),
      provider_phone: normalizeString(body.provider_phone),
      practice_phone: normalizeString(body.practice_phone),
      practice_fax: normalizeString(body.practice_fax),
      communication_preference: normalizeString(body.communication_preference),
      communication_value: normalizeString(body.communication_value),
      source: "website",
      status: "PENDING",
      raw_json: rawBody, // Store complete original payload
    };

    // Insert into inbound_referrals table
    const { data, error } = await supabase
      .from("inbound_referrals")
      .insert(inboundReferralData)
      .select()
      .single();

    if (error) {
      console.error("Error creating inbound referral:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Referral received successfully",
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in inbound-referrals POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
