import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import Papa from "papaparse";

interface CSVRow {
  "First Name": string;
  "Last Name": string;
  NPI?: string;
  Specialty?: string;
  Email?: string;
  Phone?: string;
  "Practice Name"?: string;
  "Practice Address"?: string;
  "Practice City"?: string;
  "Practice State"?: string;
  "Practice ZIP"?: string;
  "Practice Phone"?: string;
  "Practice Fax"?: string;
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
  details: {
    row: number;
    status: "success" | "skipped" | "error";
    message: string;
    provider?: string;
  }[];
}

// POST /api/app/providers/import - Import providers from CSV
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV or XLS file." },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV file", details: parseResult.errors },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    // Fetch all existing providers and practices to check for duplicates
    const { data: existingProviders } = await supabase
      .from("providers")
      .select("id, first_name, last_name, npi, email");

    const { data: existingPractices } = await supabase
      .from("practices")
      .select("id, name, address_line1, city, state, zip_code");

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because of header row and 0-indexing

      try {
        // Validate required fields
        if (!row["First Name"] || !row["Last Name"]) {
          result.errors++;
          result.details.push({
            row: rowNum,
            status: "error",
            message: "Missing required fields: First Name and Last Name",
            provider: `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim(),
          });
          continue;
        }

        // Check for duplicate provider by NPI or name+email combination
        const isDuplicate = existingProviders?.some((p) => {
          if (row.NPI && p.npi && row.NPI.trim() === p.npi) {
            return true;
          }
          if (
            p.first_name?.toLowerCase() === row["First Name"].toLowerCase() &&
            p.last_name?.toLowerCase() === row["Last Name"].toLowerCase() &&
            row.Email &&
            p.email &&
            row.Email.toLowerCase() === p.email.toLowerCase()
          ) {
            return true;
          }
          return false;
        });

        if (isDuplicate) {
          result.skipped++;
          result.details.push({
            row: rowNum,
            status: "skipped",
            message: "Provider already exists (duplicate NPI or name+email)",
            provider: `${row["First Name"]} ${row["Last Name"]}`,
          });
          continue;
        }

        // Handle practice - find or create
        let practiceId: string | null = null;

        if (row["Practice Name"]) {
          // Try to find existing practice by name and location
          const existingPractice = existingPractices?.find((p) => {
            if (p.name.toLowerCase() !== row["Practice Name"]!.toLowerCase()) {
              return false;
            }
            // If address or city is provided, match on those too
            if (row["Practice City"] && p.city) {
              return p.city.toLowerCase() === row["Practice City"].toLowerCase();
            }
            return true;
          });

          if (existingPractice) {
            practiceId = existingPractice.id;
          } else {
            // Create new practice
            const { data: newPractice, error: practiceError } = await supabase
              .from("practices")
              .insert({
                name: row["Practice Name"],
                address_line1: row["Practice Address"] || null,
                city: row["Practice City"] || null,
                state: row["Practice State"] || null,
                zip_code: row["Practice ZIP"] || null,
                phone: row["Practice Phone"] || null,
                fax: row["Practice Fax"] || null,
                is_active: true,
              })
              .select("id")
              .single();

            if (practiceError) {
              console.error("Error creating practice:", practiceError);
            } else if (newPractice) {
              practiceId = newPractice.id;
              // Add to existing practices list for future rows
              if (existingPractices) {
                existingPractices.push({
                  id: newPractice.id,
                  name: row["Practice Name"],
                  address_line1: row["Practice Address"] || null,
                  city: row["Practice City"] || null,
                  state: row["Practice State"] || null,
                  zip_code: row["Practice ZIP"] || null,
                });
              }
            }
          }
        }

        // Create provider
        const { data: newProvider, error: providerError } = await supabase
          .from("providers")
          .insert({
            practice_id: practiceId,
            first_name: row["First Name"],
            last_name: row["Last Name"],
            npi: row.NPI?.trim() || null,
            specialty: row.Specialty?.trim() || null,
            email: row.Email?.trim() || null,
            phone: row.Phone?.trim() || null,
            is_active: true,
          })
          .select("id, first_name, last_name")
          .single();

        if (providerError) {
          result.errors++;
          result.details.push({
            row: rowNum,
            status: "error",
            message: `Failed to create provider: ${providerError.message}`,
            provider: `${row["First Name"]} ${row["Last Name"]}`,
          });
          continue;
        }

        // Add to existing providers list for duplicate checking
        if (existingProviders && newProvider) {
          existingProviders.push({
            id: newProvider.id,
            first_name: newProvider.first_name,
            last_name: newProvider.last_name,
            npi: row.NPI?.trim() || null,
            email: row.Email?.trim() || null,
          });
        }

        result.success++;
        result.details.push({
          row: rowNum,
          status: "success",
          message: practiceId
            ? "Provider created and linked to practice"
            : "Provider created (no practice)",
          provider: `${row["First Name"]} ${row["Last Name"]}`,
        });
      } catch (error) {
        result.errors++;
        result.details.push({
          row: rowNum,
          status: "error",
          message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
          provider: `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim(),
        });
      }
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Error in provider import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
