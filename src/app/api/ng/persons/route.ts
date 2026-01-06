import { NextRequest, NextResponse } from "next/server";
import {
  createNextGenClient,
  NextGenApiError,
  NextGenEnvironment,
  CreatePersonParams,
  PersonSearchParams,
} from "@/lib/nextgen-api";

/**
 * GET /api/ng/persons
 *
 * Search persons with OData filtering in the NextGen API.
 *
 * Query Parameters:
 * - env: 'prod' | 'test' (default: 'test')
 * - patientsOnly: Only return patients (default: true)
 * - $top: Number of results to return
 * - $skip: Number of results to skip
 * - $filter: OData filter expression
 * - $orderby: OData order by expression
 * - $count: Include total count
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

    // Build search parameters
    const searchParamsObj: PersonSearchParams = {};

    const patientsOnly = searchParams.get("patientsOnly");
    const $top = searchParams.get("$top");
    const $skip = searchParams.get("$skip");
    const $filter = searchParams.get("$filter");
    const $orderby = searchParams.get("$orderby");
    const $count = searchParams.get("$count");

    searchParamsObj.patientsOnly = patientsOnly !== "false";

    if ($top) {
      const topNum = parseInt($top, 10);
      if (isNaN(topNum) || topNum < 1) {
        return NextResponse.json(
          { error: "$top must be a positive integer" },
          { status: 400 }
        );
      }
      searchParamsObj.$top = topNum;
    }

    if ($skip) {
      const skipNum = parseInt($skip, 10);
      if (isNaN(skipNum) || skipNum < 0) {
        return NextResponse.json(
          { error: "$skip must be a non-negative integer" },
          { status: 400 }
        );
      }
      searchParamsObj.$skip = skipNum;
    }

    if ($filter) searchParamsObj.$filter = $filter;
    if ($orderby) searchParamsObj.$orderby = $orderby;
    if ($count === "true") searchParamsObj.$count = true;

    // Create client and perform search
    const client = createNextGenClient(env);
    const result = await client.searchPersons(searchParamsObj);

    return NextResponse.json({
      success: true,
      environment: env,
      count: result.Items?.length || 0,
      totalCount: result.Count,
      nextPageLink: result.NextPageLink,
      persons: result.Items || [],
    });
  } catch (error) {
    console.error("Error in person search:", error);

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

/**
 * POST /api/ng/persons
 *
 * Create a new person in the NextGen API.
 *
 * Query Parameters:
 * - env: 'prod' | 'test' (default: 'test')
 *
 * Body (JSON):
 * - LastName: string (required)
 * - FirstName: string (required)
 * - DateOfBirth: string (required, format: YYYY-MM-DD)
 * - Sex: 'M' | 'F' | 'U' (required)
 * - MiddleName?: string
 * - AddressLine1?: string
 * - City?: string
 * - State?: string
 * - Zip?: string
 * - HomePhone?: string
 * - CellPhone?: string
 * - EmailAddress?: string
 * - IgnoreDuplicatePersons?: boolean
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["LastName", "FirstName", "DateOfBirth", "Sex"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate Sex value
    const validSexValues = ["M", "F", "U"];
    if (!validSexValues.includes(body.Sex)) {
      return NextResponse.json(
        { error: "Sex must be 'M', 'F', or 'U'" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.DateOfBirth)) {
      return NextResponse.json(
        { error: "DateOfBirth must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Build create params
    const createParams: CreatePersonParams = {
      LastName: body.LastName,
      FirstName: body.FirstName,
      DateOfBirth: body.DateOfBirth,
      Sex: body.Sex,
    };

    // Add optional fields
    if (body.MiddleName) createParams.MiddleName = body.MiddleName;
    if (body.AddressLine1) createParams.AddressLine1 = body.AddressLine1;
    if (body.AddressLine2) createParams.AddressLine2 = body.AddressLine2;
    if (body.City) createParams.City = body.City;
    if (body.State) createParams.State = body.State;
    if (body.Zip) createParams.Zip = body.Zip;
    if (body.HomePhone) createParams.HomePhone = body.HomePhone;
    if (body.CellPhone) createParams.CellPhone = body.CellPhone;
    if (body.EmailAddress) createParams.EmailAddress = body.EmailAddress;
    if (body.SocialSecurityNumber) createParams.SocialSecurityNumber = body.SocialSecurityNumber;
    if (body.OtherIdNumber) createParams.OtherIdNumber = body.OtherIdNumber;
    if (body.IgnoreDuplicatePersons !== undefined) {
      createParams.IgnoreDuplicatePersons = body.IgnoreDuplicatePersons;
    }

    // Create client and create person
    const client = createNextGenClient(env);
    const person = await client.createPerson(createParams);

    return NextResponse.json(
      {
        success: true,
        environment: env,
        person,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating person:", error);

    if (error instanceof NextGenApiError) {
      // Handle duplicate person conflict
      if (error.statusCode === 409) {
        return NextResponse.json(
          { error: "A duplicate person already exists. Set IgnoreDuplicatePersons to true to create anyway." },
          { status: 409 }
        );
      }
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
