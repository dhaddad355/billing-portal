import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create chainable mock for Supabase
const createSupabaseMock = () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();

  mockSelect.mockImplementation(() => ({
    single: mockSingle,
    eq: mockEq,
  }));

  mockInsert.mockImplementation(() => ({
    select: mockSelect,
  }));

  return {
    from: vi.fn().mockImplementation((table) => {
      if (table === "referrals") {
        return {
          insert: mockInsert,
        };
      }
      if (table === "referral_notes") {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
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

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      azureOid: "azure-123",
      email: "test@example.com",
    },
  }),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("Referrals API - POST /api/app/referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabase = createSupabaseMock();
  });

  it("should create a referral with patient_full_name", async () => {
    const mockReferralData = {
      id: "referral-123",
      provider_id: "provider-456",
      patient_full_name: "John Doe",
      patient_dob: "1990-01-15",
      patient_phone: "555-1234",
      patient_email: "john@example.com",
      referral_reason: "Consultation",
      scheduling_preference: "morning",
      communication_preference: "email",
      status: "OPEN",
      sub_status: "Scheduling",
      created_by: "user-123",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockReferralData,
      error: null,
    });

    const requestBody = {
      provider_id: "provider-456",
      patient_full_name: "John Doe",
      patient_dob: "1990-01-15",
      patient_phone: "555-1234",
      patient_email: "john@example.com",
      referral_reason: "Consultation",
      scheduling_preference: "morning",
      communication_preference: "email",
    };

    const request = new Request("http://localhost:3000/api/app/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/app/referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.referral).toBeDefined();
    expect(data.referral.patient_full_name).toBe("John Doe");
    expect(mockSupabase.from).toHaveBeenCalledWith("referrals");
  });

  it("should reject request without patient_full_name", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: {
        message: 'null value in column "patient_full_name" of relation "referrals" violates not-null constraint',
      },
    });

    const requestBody = {
      provider_id: "provider-456",
      // Missing patient_full_name
      patient_dob: "1990-01-15",
      referral_reason: "Consultation",
      scheduling_preference: "morning",
      communication_preference: "email",
    };

    const request = new Request("http://localhost:3000/api/app/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const { POST } = await import("@/app/api/app/referrals/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("patient_full_name");
  });
});
