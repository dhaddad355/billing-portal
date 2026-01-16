import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create chainable mock for Supabase
const createSupabaseMock = () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();

  mockInsert.mockImplementation(() => ({
    select: mockSelect,
  }));

  mockSelect.mockImplementation(() => ({
    single: mockSingle,
  }));

  return {
    from: vi.fn().mockImplementation((table) => {
      if (table === "inbound_referrals") {
        return {
          insert: mockInsert,
        };
      }
      return {};
    }),
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
  };
};

let mockSupabase = createSupabaseMock();

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabase,
}));

describe("Inbound Referrals API - POST /api/inbound-referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabase = createSupabaseMock();
    
    // Set the API key
    process.env.REFERRAL_INGEST_API_KEY = "test-api-key";
  });

  it("should reject requests without API key", async () => {
    const requestBody = {
      patient_full_name: "John Doe",
      patient_dob: "1990-01-15",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject requests with invalid API key", async () => {
    const requestBody = {
      patient_full_name: "John Doe",
      patient_dob: "1990-01-15",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "wrong-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should accept inbound referral with valid API key and all string values", async () => {
    const mockInboundReferralData = {
      id: "inbound-123",
      patient_full_name: "John Doe",
      patient_first_name: "John",
      patient_last_name: "Doe",
      patient_dob: "1990-01-15",
      patient_phone: "555-1234",
      patient_email: "john@example.com",
      referral_reason: "Laser Vision Correction",
      provider_name: "Dr. Smith",
      practice_name: "Smith Eye Care",
      status: "PENDING",
      source: "website",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockInboundReferralData,
      error: null,
    });

    const requestBody = {
      patient_full_name: "John Doe",
      patient_first_name: "John",
      patient_last_name: "Doe",
      patient_dob: "1990-01-15",
      patient_phone: "555-1234",
      patient_email: "john@example.com",
      referral_reason: "Laser Vision Correction",
      provider_name: "Dr. Smith",
      practice_name: "Smith Eye Care",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Referral received successfully");
    expect(data.id).toBe("inbound-123");
    expect(mockSupabase.from).toHaveBeenCalledWith("inbound_referrals");
  });

  it("should normalize numeric values to strings", async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: "inbound-456" },
      error: null,
    });

    const requestBody = {
      patient_full_name: "Jane Smith",
      patient_phone: 5551234, // Number instead of string
      patient_dob: "1985-05-20",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it("should handle empty strings by converting to null", async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: "inbound-789" },
      error: null,
    });

    const requestBody = {
      patient_full_name: "Test Patient",
      patient_phone: "", // Empty string
      patient_email: "   ", // Whitespace only
      provider_name: "Dr. Jones",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it("should store raw JSON payload for audit purposes", async () => {
    let capturedInsertData: Record<string, unknown> | null = null;

    mockSupabase.from.mockImplementation((table) => {
      if (table === "inbound_referrals") {
        return {
          insert: (data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: "test-id" }, error: null }),
              }),
            };
          },
        };
      }
      return {};
    });

    const requestBody = {
      patient_full_name: "Test Patient",
      custom_field: "custom_value", // Extra field not in schema
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);

    expect(response.status).toBe(201);
    expect(capturedInsertData).toBeDefined();
    expect(capturedInsertData.raw_json).toEqual(requestBody);
    expect(capturedInsertData.source).toBe("website");
    expect(capturedInsertData.status).toBe("PENDING");
  });

  it("should handle database errors gracefully", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database connection error" },
    });

    const requestBody = {
      patient_full_name: "Test Patient",
    };

    const request = new Request("http://localhost:3000/api/inbound-referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
      },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/inbound-referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Database connection error");
  });
});
