import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
};

vi.mock("@/lib/supabase", () => ({
  getServiceClient: () => mockSupabaseClient,
  STORAGE_BUCKET: "statements",
}));

// Create a valid PDF buffer (minimal PDF)
const createValidPdfBuffer = () => {
  const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
  return Buffer.from(pdfContent);
};

// Create invalid PDF buffer
const createInvalidPdfBuffer = () => {
  return Buffer.from("This is not a PDF file");
};

describe("Statement Ingest API - POST /api/statement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseClient.upsert.mockResolvedValue({ error: null });
    mockSupabaseClient.insert.mockResolvedValue({ error: null });
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
  });

  describe("Authentication", () => {
    it("should reject requests without API key", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      // Import dynamically to pick up mocks
      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject requests with invalid API key", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "wrong-api-key",
        },
        body: JSON.stringify({}),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("should reject requests without person_id", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("person_id is required");
    });

    it("should reject requests without account_number_full", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          patient_balance: 100.0,
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("account_number_full is required");
    });

    it("should reject requests without patient_balance", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("patient_balance is required");
    });

    it("should reject requests without PDF file", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("PDF file is required");
    });

    it("should reject requests with invalid PDF (wrong format)", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          pdf_base64: createInvalidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid PDF file format");
    });
  });

  describe("Success Cases", () => {
    it("should successfully create a statement with valid JSON payload", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          account_number_suffix: 1,
          patient_balance: 250.0,
          first_name: "John",
          last_name: "Doe",
          email_address: "john@example.com",
          cell_phone: "+15551234567",
          statement_date: "2025-01-15",
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.statementId).toBeDefined();
    });

    it("should handle optional date fields correctly", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          last_statement_date: "2024-12-15",
          next_statement_date: "2025-02-15",
          last_pay_date: "2024-11-01",
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("Database Operations", () => {
    it("should upsert person record", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          first_name: "John",
          last_name: "Doe",
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      await POST(request as any);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("persons");
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
    });

    it("should upload PDF to storage", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      await POST(request as any);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("statements");
    });

    it("should create statement event log entry", async () => {
      const request = new Request("http://localhost:3000/api/statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
        },
        body: JSON.stringify({
          person_id: 12345,
          account_number_full: "ACC-001",
          patient_balance: 100.0,
          pdf_base64: createValidPdfBuffer().toString("base64"),
        }),
      });

      const { POST } = await import("@/app/api/statement/route");
      await POST(request as any);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("statement_events");
    });
  });
});
