import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock twilio
vi.mock("twilio", () => ({
  default: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: "test-sid" }),
    },
  }),
}));

// Mock postmark
vi.mock("postmark", () => ({
  ServerClient: vi.fn().mockImplementation(() => ({
    sendEmail: vi.fn().mockResolvedValue({ MessageID: "test-message-id" }),
  })),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
  generateShortCode: vi.fn().mockReturnValue("ABC123"),
}));

// Create chainable mock for Supabase
const createSupabaseMock = () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn();

  // Set up chain returns
  mockEq.mockImplementation(() => ({
    single: mockSingle,
    eq: mockEq,
  }));
  
  mockUpdate.mockImplementation(() => ({
    eq: mockEq,
  }));

  return {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({ eq: mockEq }),
      update: mockUpdate,
      insert: mockInsert,
    })),
    update: mockUpdate,
    insert: mockInsert,
    eq: mockEq,
    single: mockSingle,
  };
};

let mockSupabase = createSupabaseMock();

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabase,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";

describe("Send Statement API - Basic Tests", () => {
  const PERSON_ID = "11111111-2222-3333-4444-555555555555";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabase = createSupabaseMock();
    
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: { id: "user-123", azureOid: "oid-123", name: "Test User" },
    });
  });

  it("should reject unauthenticated requests", async () => {
    (getServerSession as unknown as Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/statements/test-id/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/send/route");
    const response = await POST(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent statement", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const request = new NextRequest("http://localhost:3000/api/statements/nonexistent/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/send/route");
    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Statement not found");
  });

  it("should reject non-PENDING statements", async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: "stmt-1", status: "SENT" },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/statements/stmt-1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/send/route");
    const response = await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("PENDING");
  });

  it("should send successfully with valid statement", async () => {
    // First call for getting statement - returns PENDING statement with person data
    // Second call for checking short code uniqueness - returns no existing record
    let singleCallCount = 0;
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        // First call: get statement
        return Promise.resolve({
          data: {
            id: "stmt-1",
            status: "PENDING",
            person_id: PERSON_ID,
            patient_balance: 100,
            persons: {
              full_name: "John Doe",
              email_address: "john@example.com",
              cell_phone: "+15551234567",
            },
          },
          error: null,
        });
      }
      // Subsequent calls: check short code uniqueness
      return Promise.resolve({ data: null, error: null });
    });

    // Mock the update to not return error
    mockSupabase.eq.mockImplementation(() => ({
      single: mockSupabase.single,
      eq: mockSupabase.eq,
    }));

    const request = new NextRequest("http://localhost:3000/api/statements/stmt-1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/send/route");
    const response = await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.shortCode).toBe("ABC123");
    expect(data.viewUrl).toContain("ABC123");
  });
});
