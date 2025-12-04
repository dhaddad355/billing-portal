import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Type definitions for Next.js route context
type RouteContext = { params: { shortcode: string } };

// Create chainable mock for Supabase
const createSupabaseMock = () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn();
  const mockUpdate = vi.fn();
  const mockCreateSignedUrl = vi.fn();

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
    })),
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
    eq: mockEq,
    single: mockSingle,
    update: mockUpdate,
    createSignedUrl: mockCreateSignedUrl,
  };
};

let mockSupabase = createSupabaseMock();

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabase,
  STORAGE_BUCKET: "statements",
}));

describe("Patient View API - GET /api/view/[shortcode]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabase = createSupabaseMock();
  });

  it("should return 404 for invalid short code", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const request = new Request("http://localhost:3000/api/view/INVALID/pdf", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/view/[shortcode]/pdf/route");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ shortcode: "INVALID" }) } as RouteContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Statement not found");
  });

  it("should return 400 for non-SENT statement", async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: "stmt-1", pdf_path: "path/to/pdf.pdf", status: "PENDING" },
      error: null,
    });

    const request = new Request("http://localhost:3000/api/view/ABC123/pdf", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/view/[shortcode]/pdf/route");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ shortcode: "ABC123" }) } as RouteContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Statement is not available");
  });
});

describe("Patient View API - DOB Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabase = createSupabaseMock();
  });

  it("should return 404 for invalid short code", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const request = new Request("http://localhost:3000/api/view/verify-dob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ short_code: "INVALID", dob: "1990-01-15" }),
    });

    const { POST } = await import("@/app/api/view/verify-dob/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("INVALID_CODE");
  });

  it("should reject missing required fields", async () => {
    const request = new Request("http://localhost:3000/api/view/verify-dob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ short_code: "ABC123" }), // missing dob
    });

    const { POST } = await import("@/app/api/view/verify-dob/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("MISSING_FIELDS");
  });

  it("should reject missing shortcode", async () => {
    const request = new Request("http://localhost:3000/api/view/verify-dob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dob: "1990-01-15" }), // missing short_code
    });

    const { POST } = await import("@/app/api/view/verify-dob/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("MISSING_FIELDS");
  });

  it("should reject non-SENT statements", async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        id: "stmt-1",
        person_id: 12345,
        status: "PENDING",
        first_view_at: null,
        view_count: 0,
        persons: { date_of_birth: "1990-01-15" },
      },
      error: null,
    });

    const request = new Request("http://localhost:3000/api/view/verify-dob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ short_code: "ABC123", dob: "1990-01-15" }),
    });

    const { POST } = await import("@/app/api/view/verify-dob/route");
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("STATEMENT_UNAVAILABLE");
  });
});
