/**
 * NextGen API Integration Tests
 *
 * These tests run against the real NextGen Test environment.
 * Make sure the following environment variables are set:
 * - NEXTGEN_TEST_CLIENT_ID
 * - NEXTGEN_TEST_CLIENT_SECRET
 * - NEXTGEN_TEST_SITE_ID
 * - NEXTGEN_TEST_PRACTICE_ID
 * - NEXTGEN_TEST_ENTERPRISE_ID
 *
 * Run with: pnpm test src/__tests__/api/nextgen-api.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  NextGenApiClient,
  createNextGenClient,
  NextGenApiError,
  PersonLookupParams,
  CreatePersonParams,
} from "@/lib/nextgen-api";

// Skip tests if environment variables are not set
const hasCredentials = !!(
  process.env.NEXTGEN_TEST_CLIENT_ID &&
  process.env.NEXTGEN_TEST_CLIENT_SECRET &&
  process.env.NEXTGEN_TEST_SITE_ID &&
  process.env.NEXTGEN_TEST_PRACTICE_ID &&
  process.env.NEXTGEN_TEST_ENTERPRISE_ID
);

// Generate unique test data
const generateTestPerson = (): CreatePersonParams => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return {
    LastName: `TestPerson${timestamp}`,
    FirstName: `Integration${randomSuffix}`,
    DateOfBirth: "1990-01-15",
    Sex: "U",
    MiddleName: "API",
    EmailAddress: `test.${timestamp}@integration-test.local`,
    IgnoreDuplicatePersons: true,
  };
};

describe.skipIf(!hasCredentials)("NextGen API Integration Tests", () => {
  let client: NextGenApiClient;
  let createdPersonId: string | null = null;
  let testPerson: CreatePersonParams;

  beforeAll(() => {
    client = createNextGenClient("test");
    testPerson = generateTestPerson();
    // Clear any cached tokens/sessions for clean test run
    NextGenApiClient.clearAllCaches();
  });

  afterAll(() => {
    // Clean up caches after tests
    NextGenApiClient.clearAllCaches();
  });

  describe("Authentication", () => {
    it("should obtain an access token", async () => {
      const token = await client.getAccessToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should cache and reuse the same token", async () => {
      const token1 = await client.getAccessToken();
      const token2 = await client.getAccessToken();

      expect(token1).toBe(token2);
    });

    it("should obtain a session ID", async () => {
      const sessionId = await client.getSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it("should cache and reuse the same session ID", async () => {
      const sessionId1 = await client.getSessionId();
      const sessionId2 = await client.getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe("Create Person", () => {
    it("should create a new person with required fields", async () => {
      const person = await client.createPerson(testPerson);

      expect(person).toBeDefined();
      expect(person.id).toBeDefined();
      expect(person.firstName).toBe(testPerson.FirstName);
      expect(person.lastName).toBe(testPerson.LastName);

      // Save the person ID for subsequent tests
      createdPersonId = person.id;
    });

    it("should fail to create a person without required fields", async () => {
      const invalidPerson = {
        FirstName: "TestOnly",
        DateOfBirth: "1990-01-15",
        Sex: "U" as const,
      } as CreatePersonParams;

      await expect(client.createPerson(invalidPerson)).rejects.toThrow();
    });
  });

  describe("Person Search", () => {
    it("should search for persons with OData filtering", async () => {
      // Search for recently created persons
      const result = await client.searchPersons({
        patientsOnly: false,
        $top: 10,
      });

      expect(result).toBeDefined();
      expect(result.Items).toBeDefined();
      expect(Array.isArray(result.Items)).toBe(true);
    });

    it("should find the created person via search", async () => {
      if (!createdPersonId) {
        console.warn("Skipping test: no created person ID");
        return;
      }

      // Search with filter for our test person's last name
      const result = await client.searchPersons({
        patientsOnly: false,
        $filter: `lastName eq '${testPerson.LastName}'`,
      });

      expect(result.Items).toBeDefined();
      // The person should be in the results
      const found = result.Items.some(
        (p) => p.lastName === testPerson.LastName
      );
      expect(found).toBe(true);
    });
  });

  describe("Person Lookup", () => {
    it("should lookup persons by last name", async () => {
      if (!createdPersonId) {
        console.warn("Skipping test: no created person ID");
        return;
      }

      const lookupParams: PersonLookupParams = {
        lastName: testPerson.LastName,
        excludeExpired: true,
        searchPatientsOnly: false,
      };

      const persons = await client.lookupPersons(lookupParams);

      expect(Array.isArray(persons)).toBe(true);
      // Should find at least our created person
      const found = persons.some((p) => p.lastName === testPerson.LastName);
      expect(found).toBe(true);
    });

    it("should lookup persons by first and last name", async () => {
      if (!createdPersonId) {
        console.warn("Skipping test: no created person ID");
        return;
      }

      const lookupParams: PersonLookupParams = {
        firstName: testPerson.FirstName,
        lastName: testPerson.LastName,
        excludeExpired: true,
        searchPatientsOnly: false,
      };

      const persons = await client.lookupPersons(lookupParams);

      expect(Array.isArray(persons)).toBe(true);
      const found = persons.some(
        (p) =>
          p.firstName === testPerson.FirstName &&
          p.lastName === testPerson.LastName
      );
      expect(found).toBe(true);
    });

    it("should return empty array for non-existent person", async () => {
      const lookupParams: PersonLookupParams = {
        lastName: "NonExistentLastName" + Date.now(),
        firstName: "NonExistentFirstName" + Date.now(),
        excludeExpired: true,
        searchPatientsOnly: false,
      };

      const persons = await client.lookupPersons(lookupParams);

      expect(Array.isArray(persons)).toBe(true);
      expect(persons.length).toBe(0);
    });
  });

  describe("Get Person by ID", () => {
    it("should get person by ID", async () => {
      if (!createdPersonId) {
        console.warn("Skipping test: no created person ID");
        return;
      }

      const person = await client.getPersonById(createdPersonId);

      expect(person).toBeDefined();
      expect(person.id).toBe(createdPersonId);
      expect(person.firstName).toBe(testPerson.FirstName);
      expect(person.lastName).toBe(testPerson.LastName);
    });

    it("should get person with expanded demographics", async () => {
      if (!createdPersonId) {
        console.warn("Skipping test: no created person ID");
        return;
      }

      const person = await client.getPersonById(
        createdPersonId,
        "Demographics"
      );

      expect(person).toBeDefined();
      expect(person.id).toBe(createdPersonId);
    });

    it("should throw 404 for non-existent person ID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await expect(client.getPersonById(fakeId)).rejects.toThrow(
        NextGenApiError
      );
    });
  });

  describe("Full Workflow Test", () => {
    it("should complete full person workflow: create, search, lookup, get", async () => {
      // Step 1: Create a unique test person
      const uniquePerson = generateTestPerson();
      const created = await client.createPerson(uniquePerson);

      expect(created.id).toBeDefined();
      const personId = created.id;

      // Step 2: Verify person can be found via search
      const searchResult = await client.searchPersons({
        patientsOnly: false,
        $filter: `lastName eq '${uniquePerson.LastName}'`,
      });

      const foundInSearch = searchResult.Items.some((p) => p.id === personId);
      expect(foundInSearch).toBe(true);

      // Step 3: Verify person can be found via lookup
      const lookupResult = await client.lookupPersons({
        firstName: uniquePerson.FirstName,
        lastName: uniquePerson.LastName,
        searchPatientsOnly: false,
      });

      const foundInLookup = lookupResult.some((p) => p.id === personId);
      expect(foundInLookup).toBe(true);

      // Step 4: Get full person details
      const fullPerson = await client.getPersonById(personId);

      expect(fullPerson.id).toBe(personId);
      expect(fullPerson.firstName).toBe(uniquePerson.FirstName);
      expect(fullPerson.lastName).toBe(uniquePerson.LastName);
      expect(fullPerson.dateOfBirth).toContain("1990-01-15");
    });
  });
});

describe.skipIf(hasCredentials)("NextGen API Integration Tests - Skipped", () => {
  it("should skip tests when credentials are not configured", () => {
    console.warn(
      "NextGen API integration tests skipped: Missing environment variables.\n" +
        "Required variables:\n" +
        "  - NEXTGEN_TEST_CLIENT_ID\n" +
        "  - NEXTGEN_TEST_CLIENT_SECRET\n" +
        "  - NEXTGEN_TEST_SITE_ID\n" +
        "  - NEXTGEN_TEST_PRACTICE_ID\n" +
        "  - NEXTGEN_TEST_ENTERPRISE_ID"
    );
    expect(true).toBe(true);
  });
});
