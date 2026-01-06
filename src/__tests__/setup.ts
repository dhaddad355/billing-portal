import "@testing-library/jest-dom/vitest";

// Mock environment variables for tests
process.env.STATEMENT_INGEST_API_KEY = "test-api-key";
process.env.TWILIO_ACCOUNT_SID = "test-account-sid";
process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
process.env.TWILIO_PHONE_NUMBER = "+15555555555";
process.env.POSTMARK_API_TOKEN = "test-postmark-token";
process.env.POSTMARK_FROM_EMAIL = "mylei@test.com";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

// NextGen API Test Environment Variables (set real values in .env.local for integration tests)
// These are intentionally left as placeholder values for unit tests
// Integration tests will skip if these are not set to real values
