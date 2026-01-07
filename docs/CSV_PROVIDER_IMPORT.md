# CSV Provider Import Feature

## Overview

This feature allows you to import providers (referring physicians) from a CSV file exported from your internal system. It supports multiple CSV formats and includes smart duplicate detection and automatic practice matching/creation.

## Supported CSV Formats

The import tool supports two CSV formats:

### Format 1: Simple Format (Separate First/Last Name)

**Required Columns:**
- `First Name` - Provider's first name
- `Last Name` - Provider's last name

**Optional Provider Columns:**
- `NPI` - National Provider Identifier (10 digits)
- `Specialty` - Medical specialty (e.g., Optometry, Ophthalmology)
- `Email` - Provider's email address
- `Phone` - Provider's phone number

**Optional Practice Columns:**
- `Practice Name` - Name of the practice/clinic
- `Practice Address` - Street address
- `Practice City` - City
- `Practice State` - State (2-letter abbreviation)
- `Practice ZIP` - ZIP code
- `Practice Phone` - Practice phone number
- `Practice Fax` - Practice fax number

**Example:**
```csv
First Name,Last Name,NPI,Specialty,Email,Phone,Practice Name,Practice Address,Practice City,Practice State,Practice ZIP
John,Smith,1234567890,Optometry,john.smith@example.com,555-1234,Vision Care Center,123 Main St,Portland,OR,97201
```

### Format 2: Internal System Format (Combined Name)

**Required Columns:**
- `Name` - Provider's name in "Last, First" format (e.g., "Smith, John")

**Optional Provider Columns:**
- `NPI` - National Provider Identifier
- `Degree` - Provider's degree (MD, DO, OD, etc.)
- `Taxonomy` - Medical taxonomy (specialty will be extracted from middle section)
- `Email Addr` - Provider's email address
- `Bus Phone` - Provider's business phone number

**Optional Practice/Location Columns:**
- `Hsp Affil` - Hospital affiliation (used as practice name)
- `Addr 1` - Street address line 1
- `Addr 2` - Street address line 2
- `City` - City
- `State` - State
- `Zip` - ZIP code
- `Bus Fax` - Business fax number

**Example:**
```csv
Name,NPI,Degree,Taxonomy,Email Addr,Bus Phone,Addr 1,City,State,Zip,Hsp Affil
"Smith, John",1234567890,MD,Allopathic & Osteopathic Physicians : Optometry,john.smith@example.com,(555) 123-4567,123 Main St,Portland,OR,97201,Vision Care Center
```

**Note:** The Taxonomy field is parsed to extract the specialty. For example:
- `Allopathic & Osteopathic Physicians : Optometry` → Specialty: "Optometry"
- `Eye and Vision Services Providers : Optometrist` → Specialty: "Optometrist"

## How to Use

### 1. Prepare Your CSV File

Export your provider data from your internal system. The tool will automatically detect which format you're using based on the column headers.

### 2. Sample CSV Templates

Two sample templates are available for download in the import modal:
- `sample-providers.csv` - Simple format
- `sample-providers-internal-format.csv` - Internal system format

### 3. Import Process

1. Navigate to **Referrals > Providers** in the application
2. Click the **"Import CSV"** button
3. Click **"Choose File"** and select your CSV file
4. Review the format requirements
5. Click **"Import Providers"**
6. Review the import results

### 4. Understanding Import Results

The import process will show you:

- **Imported** (Green) - Successfully created new providers
- **Skipped** (Yellow) - Providers that already exist (duplicates)
- **Errors** (Red) - Providers that failed to import with error details

Each row in the results shows:
- Row number from CSV
- Provider name
- Status (success/skipped/error)
- Message explaining the result

## Features

### Duplicate Detection

The system automatically detects duplicate providers using:

1. **NPI Match** - If the NPI already exists in the system
2. **Name + Email Match** - If the same first name, last name, and email combination exists

Duplicates are skipped and not re-imported.

### Practice Matching

When a CSV row includes practice information, the system:

1. **Searches for existing practice** by name and city
2. **Creates new practice** if no match is found
3. **Links provider to practice** automatically

If both practices have the same name but different cities, they are treated as separate practices.

### Unmapped Providers

Providers imported without practice information are marked as "Unmapped". You can:

1. Use the **"Show unmapped providers only"** checkbox to filter the list
2. Click **"Edit"** on any provider to assign them to a practice
3. Create a new practice if needed

## Database Migration

Before using this feature, ensure the database migration has been applied:

```sql
-- File: supabase/migrations/20250107000000_add_provider_npi_specialty.sql
```

This adds the `npi` and `specialty` fields to the providers table.

## Troubleshooting

### Common Issues

**"Invalid file type"**
- Only CSV files are supported
- Ensure your file has a `.csv` extension

**"Missing required fields"**
- Both First Name and Last Name are required for every row
- Check that your CSV headers match the expected format exactly

**"Provider already exists"**
- This is expected behavior for duplicates
- The provider was not re-imported to avoid duplicates
- You can verify the existing provider in the providers list

**"Failed to create practice"**
- Check that the practice name is provided
- Verify database connectivity
- Check application logs for detailed error messages

## Tips

1. **Test with a small CSV first** - Import a few rows to verify the format works
2. **Review unmapped providers** - After import, check for unmapped providers and assign practices
3. **Use the filter** - The "Show unmapped only" filter helps you quickly find providers needing practice assignments
4. **Keep NPIs unique** - NPIs should be unique per provider; duplicates will be skipped
5. **Standardize practice names** - Use consistent practice names to improve matching

## API Endpoint

For programmatic access:

```
POST /api/app/providers/import
Content-Type: multipart/form-data

Parameters:
- file: CSV file (required)
```

Response:
```json
{
  "result": {
    "success": 10,
    "skipped": 2,
    "errors": 0,
    "details": [
      {
        "row": 2,
        "status": "success",
        "message": "Provider created and linked to practice",
        "provider": "John Smith"
      }
    ]
  }
}
```
