import { NextRequest, NextResponse } from "next/server";
import { createNextGenClient, NextGenApiError, NextGenEnvironment, PersonLookupParams } from "@/lib/nextgen-api";

/**
 * GET /api/ng/persons/lookup
 *
 * Lookup persons by various criteria in the NextGen API.
 *
 * Query Parameters:
 * - env: 'prod' | 'test' (default: 'test')
 * - firstName: First name to search
 * - lastName: Last name to search
 * - dateOfBirth: Date of birth (format: YYYY-MM-DD)
 * - excludeExpired: Exclude deceased patients (default: true)
 * - searchPatientsOnly: Only search patients (default: true)
 * - quickSearchId: Quick search type (PersonNumber, MedicalRecordNumber, OtherIdNumber, SocialSecurityNumber, PhoneNumber)
 * - quickSearchInput: Value for quick search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get environment (default to test for safety)
    const env = (searchParams.get("env") || "test") as NextGenEnvironment;
    if (env !== "prod" && env !== "test") {
      return NextResponse.json(
        { error: "Invalid environment. Must be 'prod' or 'test'" },
        { status: 400 }
      );
    }

    // Build lookup parameters
    const lookupParams: PersonLookupParams = {};

    // Handle quick search (takes precedence over other params)
    const quickSearchId = searchParams.get("quickSearchId");
    const quickSearchInput = searchParams.get("quickSearchInput");

    if (quickSearchId && quickSearchInput) {
      const validQuickSearchIds = [
        "PersonNumber",
        "MedicalRecordNumber",
        "OtherIdNumber",
        "SocialSecurityNumber",
        "PhoneNumber",
      ];
      if (!validQuickSearchIds.includes(quickSearchId)) {
        return NextResponse.json(
          { error: `Invalid quickSearchId. Must be one of: ${validQuickSearchIds.join(", ")}` },
          { status: 400 }
        );
      }
      lookupParams.quickSearchId = quickSearchId as PersonLookupParams["quickSearchId"];
      lookupParams.quickSearchInput = quickSearchInput;
    } else {
      // Standard lookup parameters
      const firstName = searchParams.get("firstName");
      const lastName = searchParams.get("lastName");
      const middleName = searchParams.get("middleName");
      const dateOfBirth = searchParams.get("dateOfBirth");
      const addressLine1 = searchParams.get("addressLine1");
      const city = searchParams.get("city");
      const zip = searchParams.get("zip");
      const sex = searchParams.get("sex");
      const emailAddress = searchParams.get("emailAddress");

      // At least one search parameter is required
      if (!firstName && !lastName && !dateOfBirth && !emailAddress) {
        return NextResponse.json(
          { error: "At least one search parameter is required (firstName, lastName, dateOfBirth, or emailAddress)" },
          { status: 400 }
        );
      }

      if (firstName) lookupParams.firstName = firstName;
      if (lastName) lookupParams.lastName = lastName;
      if (middleName) lookupParams.middleName = middleName;
      if (dateOfBirth) lookupParams.dateOfBirth = dateOfBirth;
      if (addressLine1) lookupParams.addressLine1 = addressLine1;
      if (city) lookupParams.city = city;
      if (zip) lookupParams.zip = zip;
      if (sex) lookupParams.sex = sex;
      if (emailAddress) lookupParams.emailAddress = emailAddress;
    }

    // Optional filters
    const excludeExpired = searchParams.get("excludeExpired");
    const searchPatientsOnly = searchParams.get("searchPatientsOnly");

    lookupParams.excludeExpired = excludeExpired !== "false";
    lookupParams.searchPatientsOnly = searchPatientsOnly !== "false";

    // Create client and perform lookup
    const client = createNextGenClient(env);
    const persons = await client.lookupPersons(lookupParams);

    return NextResponse.json({
      success: true,
      environment: env,
      count: Array.isArray(persons) ? persons.length : 0,
      persons: Array.isArray(persons) ? persons : [],
    });
  } catch (error) {
    console.error("Error in person lookup:", error);

    if (error instanceof NextGenApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
