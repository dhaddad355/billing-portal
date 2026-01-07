import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import Papa from "papaparse";

interface CSVRow {
  // Support both formats - user's internal system format and simple format
  Name?: string; // User format: "Last, First" or "Last, First M."
  "First Name"?: string; // Simple format
  "Last Name"?: string; // Simple format
  NPI?: string;
  Degree?: string; // User format
  Specialty?: string; // Simple format
  Taxonomy?: string; // User format - contains specialty information
  "Email Addr"?: string; // User format
  Email?: string; // Simple format
  "Bus Phone"?: string; // User format
  Phone?: string; // Simple format
  "Addr 1"?: string; // User format
  "Addr 2"?: string; // User format
  City?: string; // Both formats
  State?: string; // Both formats
  Zip?: string; // Both formats
  "Bus Fax"?: string; // User format
  "Hsp Affil"?: string; // User format - hospital affiliation (practice name)
  // Simple format fields
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

// Helper function to parse "Last, First M." format
function parseName(nameStr: string): { firstName: string; lastName: string } | null {
  if (!nameStr || typeof nameStr !== "string") return null;
  
  // Handle "Last, First" or "Last, First M." format
  const parts = nameStr.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return {
      lastName: parts[0],
      firstName: parts[1],
    };
  }
  
  // Handle "First Last" format as fallback
  const spaceParts = nameStr.trim().split(/\s+/);
  if (spaceParts.length >= 2) {
    return {
      firstName: spaceParts[0],
      lastName: spaceParts.slice(1).join(" "),
    };
  }
  
  return null;
}

// Helper function to extract specialty from Taxonomy field
function extractSpecialty(taxonomy: string): string | null {
  if (!taxonomy || typeof taxonomy !== "string") return null;
  
  // Taxonomy format: "Category : Specialty : Subspecialty"
  // We want the second part (Specialty)
  const parts = taxonomy.split(":").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[1];
  }
  return taxonomy; // Return as-is if format is different
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
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
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

    // Create lookup maps for O(1) duplicate detection
    const npiMap = new Map<string, boolean>();
    const nameEmailMap = new Map<string, boolean>();
    
    existingProviders?.forEach((p) => {
      if (p.npi) {
        npiMap.set(p.npi.toLowerCase(), true);
      }
      if (p.first_name && p.last_name && p.email) {
        const key = `${p.first_name.toLowerCase()}_${p.last_name.toLowerCase()}_${p.email.toLowerCase()}`;
        nameEmailMap.set(key, true);
      }
    });

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because of header row and 0-indexing

      try {
        // Parse provider name from either format
        let firstName: string;
        let lastName: string;
        
        if (row.Name) {
          // User's internal system format: "Last, First"
          const parsed = parseName(row.Name);
          if (!parsed) {
            result.errors++;
            result.details.push({
              row: rowNum,
              status: "error",
              message: "Unable to parse provider name",
              provider: row.Name,
            });
            continue;
          }
          firstName = parsed.firstName;
          lastName = parsed.lastName;
        } else if (row["First Name"] && row["Last Name"]) {
          // Simple format
          firstName = row["First Name"];
          lastName = row["Last Name"];
        } else {
          result.errors++;
          result.details.push({
            row: rowNum,
            status: "error",
            message: "Missing required fields: Name or (First Name and Last Name)",
            provider: "",
          });
          continue;
        }

        // Extract other fields from appropriate columns
        const npi = row.NPI?.trim() || null;
        const degree = row.Degree?.trim() || null;
        const specialty = row.Specialty?.trim() || (row.Taxonomy ? extractSpecialty(row.Taxonomy) : null);
        const email = (row["Email Addr"] || row.Email)?.trim() || null;
        const phone = (row["Bus Phone"] || row.Phone)?.trim() || null;

        // Check for duplicate provider by NPI or name+email combination
        let isDuplicate = false;
        
        if (npi && npiMap.has(npi.toLowerCase())) {
          isDuplicate = true;
        } else if (email) {
          const key = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${email.toLowerCase()}`;
          if (nameEmailMap.has(key)) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          result.skipped++;
          result.details.push({
            row: rowNum,
            status: "skipped",
            message: "Provider already exists (duplicate NPI or name+email)",
            provider: `${firstName} ${lastName}`,
          });
          continue;
        }

        // Handle practice - find or create
        let practiceId: string | null = null;

        // Determine practice name and details from either format
        const practiceName = row["Practice Name"] || row["Hsp Affil"] || null;
        const practiceAddress = row["Practice Address"] || row["Addr 1"] || null;
        const practiceCity = row["Practice City"] || row.City || null;
        const practiceState = row["Practice State"] || row.State || null;
        const practiceZip = row["Practice ZIP"] || row.Zip || null;
        const practicePhone = row["Practice Phone"] || row["Bus Phone"] || null;
        const practiceFax = row["Practice Fax"] || row["Bus Fax"] || null;

        if (practiceName) {
          // Try to find existing practice by name and location
          const existingPractice = existingPractices?.find((p) => {
            if (p.name.toLowerCase() !== practiceName.toLowerCase()) {
              return false;
            }
            // If both have city, they must match
            if (practiceCity && p.city) {
              return p.city.toLowerCase() === practiceCity.toLowerCase();
            }
            // If only one has city, they don't match (different locations)
            if (practiceCity || p.city) {
              return false;
            }
            // Neither has city - match on name only
            return true;
          });

          if (existingPractice) {
            practiceId = existingPractice.id;
          } else {
            // Create new practice
            const { data: newPractice, error: practiceError } = await supabase
              .from("practices")
              .insert({
                name: practiceName,
                address_line1: practiceAddress,
                city: practiceCity,
                state: practiceState,
                zip_code: practiceZip,
                phone: practicePhone,
                fax: practiceFax,
                is_active: true,
              })
              .select("id")
              .single();

            if (practiceError) {
              console.error("Error creating practice:", practiceError);
              result.errors++;
              result.details.push({
                row: rowNum,
                status: "error",
                message: `Failed to create practice: ${practiceError.message}`,
                provider: `${firstName} ${lastName}`,
              });
              continue;
            } else if (newPractice) {
              practiceId = newPractice.id;
              // Add to existing practices list for future rows
              if (existingPractices) {
                existingPractices.push({
                  id: newPractice.id,
                  name: practiceName,
                  address_line1: practiceAddress,
                  city: practiceCity,
                  state: practiceState,
                  zip_code: practiceZip,
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
            first_name: firstName,
            last_name: lastName,
            npi: npi,
            specialty: specialty,
            degree: degree,
            email: email,
            phone: phone,
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
            provider: `${firstName} ${lastName}`,
          });
          continue;
        }

        // Add to lookup maps for duplicate checking in subsequent rows
        if (existingProviders && newProvider) {
          existingProviders.push({
            id: newProvider.id,
            first_name: newProvider.first_name,
            last_name: newProvider.last_name,
            npi: npi,
            email: email,
          });
          
          // Update lookup maps
          if (npi) {
            npiMap.set(npi.toLowerCase(), true);
          }
          if (email) {
            const key = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${email.toLowerCase()}`;
            nameEmailMap.set(key, true);
          }
        }

        result.success++;
        result.details.push({
          row: rowNum,
          status: "success",
          message: practiceId
            ? "Provider created and linked to practice"
            : "Provider created (no practice)",
          provider: `${firstName} ${lastName}`,
        });
      } catch (error) {
        result.errors++;
        result.details.push({
          row: rowNum,
          status: "error",
          message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
          provider: row.Name || `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim(),
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
