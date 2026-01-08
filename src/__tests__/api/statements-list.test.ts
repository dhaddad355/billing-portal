import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Create a chainable mock
const createChainableMock = () => {
  const mockRange = vi.fn();
  const mockOrder = vi.fn(() => ({ range: mockRange }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockEq: any = vi.fn(() => ({ order: mockOrder, eq: mockEq }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, count: undefined }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    range: mockRange,
  };
};

let mockSupabaseClient = createChainableMock();

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabaseClient,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";

describe("Statements List API - GET /api/statements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseClient = createChainableMock();
    
    (getServerSession as unknown as Mock).mockResolvedValue({
      user: { id: "user-123", azureOid: "oid-123", name: "Test User" },
    });
  });

  it("should reject unauthenticated requests", async () => {
    (getServerSession as unknown as Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/statements?status=PENDING", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/(portal)/statements/route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return paginated statements", async () => {
    const PERSON_ID = "11111111-2222-3333-4444-555555555555";
    const mockStatements = [
      {
        id: "stmt-1",
        person_id: PERSON_ID,
        patient_balance: 100.0,
        status: "PENDING",
        created_at: "2025-01-01T00:00:00Z",
        persons: { full_name: "John Doe" },
      },
    ];

    // Set up the count query (first call)
    const mockEqCount = vi.fn().mockResolvedValue({ count: 25 });
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));
    
    // Set up the data query (second call)
    const mockRange = vi.fn().mockResolvedValue({ data: mockStatements, error: null });
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEqData: any = vi.fn(() => ({ order: mockOrder, eq: mockEqData }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    let callCount = 0;
    mockSupabaseClient.from.mockImplementation(
      (() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectCount };
        }
        return { select: mockSelectData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );

    const request = new NextRequest("http://localhost:3000/api/statements?status=PENDING&page=1&pageSize=10", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/(portal)/statements/route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.statements).toBeDefined();
    expect(data.pagination).toBeDefined();
  });

  it("should return empty array when no statements", async () => {
    const mockEqCount = vi.fn().mockResolvedValue({ count: 0 });
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    const mockRange = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEqData: any = vi.fn(() => ({ order: mockOrder, eq: mockEqData }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    let callCount = 0;
    mockSupabaseClient.from.mockImplementation(
      (() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectCount };
        }
        return { select: mockSelectData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );

    const request = new NextRequest("http://localhost:3000/api/statements?status=PENDING", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/(portal)/statements/route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.statements).toEqual([]);
  });

  it("should handle database errors gracefully", async () => {
    const mockEqCount = vi.fn().mockResolvedValue({ count: 0 });
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    const mockRange = vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } });
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEqData: any = vi.fn(() => ({ order: mockOrder, eq: mockEqData }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    let callCount = 0;
    mockSupabaseClient.from.mockImplementation(
      (() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectCount };
        }
        return { select: mockSelectData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );

    const request = new NextRequest("http://localhost:3000/api/statements?status=PENDING", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/(portal)/statements/route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch statements");
  });

  it("should include pagination info in response", async () => {
    const mockEqCount = vi.fn().mockResolvedValue({ count: 50 });
    const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));

    const mockRange = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder = vi.fn(() => ({ range: mockRange }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEqData: any = vi.fn(() => ({ order: mockOrder, eq: mockEqData }));
    const mockSelectData = vi.fn(() => ({ eq: mockEqData }));

    let callCount = 0;
    mockSupabaseClient.from.mockImplementation(
      (() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectCount };
        }
        return { select: mockSelectData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    );

    const request = new NextRequest("http://localhost:3000/api/statements?page=2&pageSize=10", {
      method: "GET",
    });

    const { GET } = await import("@/app/api/(portal)/statements/route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.pageSize).toBe(10);
    expect(data.pagination.total).toBe(50);
    expect(data.pagination.totalPages).toBe(5);
  });
});
