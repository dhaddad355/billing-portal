import { NextRequest, NextResponse } from "next/server";
import { createNextGenClient, NextGenApiError, NextGenEnvironment } from "@/lib/nextgen-api";

interface RouteParams {
  params: Promise<{
    personId: string;
  }>;
}

/**
 * GET /api/ng/persons/[personId]
 *
 * Get a person's full demographics by their ID from the NextGen API.
 *
 * Query Parameters:
 * - env: 'prod' | 'test' (default: 'test')
 * - $expand: Comma-separated list of expansions (e.g., 'Demographics,Insurance,GenderIdentities')
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { personId } = await params;
    const { searchParams } = new URL(request.url);

    // Validate personId
    if (!personId) {
      return NextResponse.json(
        { error: "personId is required" },
        { status: 400 }
      );
    }

    // Get environment (default to test for safety)
    const env = (searchParams.get("env") || "test") as NextGenEnvironment;
    if (env !== "prod" && env !== "test") {
      return NextResponse.json(
        { error: "Invalid environment. Must be 'prod' or 'test'" },
        { status: 400 }
      );
    }

    // Get optional expand parameter
    const expand = searchParams.get("$expand") || undefined;

    // Create client and get person
    const client = createNextGenClient(env);
    const person = await client.getPersonById(personId, expand);

    return NextResponse.json({
      success: true,
      environment: env,
      person,
    });
  } catch (error) {
    console.error("Error getting person:", error);

    if (error instanceof NextGenApiError) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
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
