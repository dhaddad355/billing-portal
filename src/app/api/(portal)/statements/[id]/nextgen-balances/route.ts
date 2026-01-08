import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";
import { createNextGenClient, NextGenApiError } from "@/lib/nextgen-api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/statements/[id]/nextgen-balances
 *
 * Fetches NextGen chart balances for the patient associated with this statement.
 * Uses the patient's first name, last name, and date of birth to look up the person in NextGen.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceClient();

    // Get the statement with person data
    const { data: statement, error: statementError } = await supabase
      .from("statements")
      .select(`
        id,
        persons (
          first_name,
          last_name,
          date_of_birth
        )
      `)
      .eq("id", id)
      .single();

    if (statementError || !statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    // Handle the persons relation (could be object or array depending on Supabase config)
    const personData = statement.persons;
    if (!personData) {
      return NextResponse.json(
        { error: "No patient information associated with this statement" },
        { status: 400 }
      );
    }

    // Extract person data - handle both array and object cases
    const person = Array.isArray(personData) ? personData[0] : personData;
    if (!person) {
      return NextResponse.json(
        { error: "No patient information associated with this statement" },
        { status: 400 }
      );
    }

    const first_name = person.first_name;
    const last_name = person.last_name;
    const date_of_birth = person.date_of_birth;

    if (!first_name || !last_name || !date_of_birth) {
      return NextResponse.json({
        success: false,
        error: "MISSING_PATIENT_DATA",
        message: "Patient first name, last name, and date of birth are required",
      });
    }

    // Create NextGen client (using prod environment)
    const client = createNextGenClient("prod");

    // Lookup the person in NextGen
    const persons = await client.lookupPersons({
      firstName: first_name,
      lastName: last_name,
      dateOfBirth: date_of_birth,
      excludeExpired: true,
      searchPatientsOnly: true,
    });

    const personCount = Array.isArray(persons) ? persons.length : 0;

    if (personCount === 0) {
      return NextResponse.json({
        success: false,
        error: "PERSON_NOT_FOUND",
        message: "No matching patient found in NextGen",
      });
    }

    if (personCount > 1) {
      return NextResponse.json({
        success: false,
        error: "MULTIPLE_PERSONS_FOUND",
        message: `Multiple patients found (${personCount}). Unable to determine which record to use.`,
        count: personCount,
      });
    }

    // Exactly one person found - get their chart balances
    const personId = persons[0].id;
    const balances = await client.getChartBalances(personId);

    return NextResponse.json({
      success: true,
      personId,
      personNumber: persons[0].personNumber,
      balances: {
        totalAmountDue: balances.totalAmountDue ?? 0,
        badDebtAmount: balances.badDebtAmount ?? 0,
        amountDueInsurance: balances.amountDueInsurance ?? 0,
        availableCredit: balances.availableCredit ?? 0,
        accountCredit: balances.accountCredit ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching NextGen balances:", error);

    if (error instanceof NextGenApiError) {
      return NextResponse.json(
        {
          success: false,
          error: "NEXTGEN_API_ERROR",
          message: error.message
        },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
