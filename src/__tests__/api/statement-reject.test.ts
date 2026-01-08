import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Create a mock that properly chains methods
const createMockSupabaseClient = () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();

  // Set up the chain
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockInsert.mockResolvedValue({ error: null });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ 
    select: mockSelect, 
    update: mockUpdate, 
    insert: mockInsert 
  });

  return {
    from: mockFrom,
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    eq: mockEq,
    single: mockSingle,
  };
};

let mockSupabaseClient = createMockSupabaseClient();

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabaseClient,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";

describe("Statement Reject API - POST /api/app/statements/[id]/reject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseClient = createMockSupabaseClient();
    
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: { id: "user-123", azureOid: "oid-123", name: "Test User" },
    });
  });

  it("should reject unauthenticated requests", async () => {
    (getServerSession as unknown as Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/app/statements/test-id/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Invalid data" }),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    const response = await POST(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject statement successfully", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: "stmt-1", status: "PENDING" },
      error: null,
    });
    mockSupabaseClient.eq.mockReturnValue({
      single: mockSupabaseClient.single,
      eq: mockSupabaseClient.eq
    });
    mockSupabaseClient.update.mockReturnValue({ eq: mockSupabaseClient.eq });

    const request = new NextRequest("http://localhost:3000/api/app/statements/stmt-1/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Duplicate statement" }),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    const response = await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should call update with REJECTED status", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: "stmt-1", status: "PENDING" },
      error: null,
    });
    mockSupabaseClient.eq.mockReturnValue({
      single: mockSupabaseClient.single,
      eq: mockSupabaseClient.eq
    });
    mockSupabaseClient.update.mockReturnValue({ eq: mockSupabaseClient.eq });

    const request = new NextRequest("http://localhost:3000/api/app/statements/stmt-1/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });

    expect(mockSupabaseClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "REJECTED",
      })
    );
  });

  it("should insert a status change event", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: "stmt-1", status: "PENDING" },
      error: null,
    });
    mockSupabaseClient.eq.mockReturnValue({ 
      single: mockSupabaseClient.single,
      eq: mockSupabaseClient.eq 
    });
    mockSupabaseClient.update.mockReturnValue({ eq: mockSupabaseClient.eq });

    const request = new NextRequest("http://localhost:3000/api/app/statements/stmt-1/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "STATUS_CHANGE",
        new_status: "REJECTED",
      })
    );
  });

  it("should return 404 for non-existent statement", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });
    mockSupabaseClient.eq.mockReturnValue({ single: mockSupabaseClient.single });

    const request = new NextRequest("http://localhost:3000/api/app/statements/nonexistent/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Test" }),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Statement not found");
  });

  it("should reject only PENDING statements", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: "stmt-1", status: "SENT" },
      error: null,
    });
    mockSupabaseClient.eq.mockReturnValue({ single: mockSupabaseClient.single });

    const request = new NextRequest("http://localhost:3000/api/app/statements/stmt-1/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Test" }),
    });

    const { POST } = await import("@/app/api/(portal)/statements/[id]/reject/route");
    const response = await POST(request, { params: Promise.resolve({ id: "stmt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("PENDING");
  });
});
