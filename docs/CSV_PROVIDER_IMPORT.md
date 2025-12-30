# CSV Provider Import Feature

## Overview

This feature allows you to import providers (referring physicians) from a CSV file exported from your internal system. It includes smart duplicate detection and automatic practice matching/creation.

## How to Use

### 1. Prepare Your CSV File

Create a CSV file with the following columns:

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

### 2. Sample CSV Format

```csv
First Name,Last Name,NPI,Specialty,Email,Phone,Practice Name,Practice Address,Practice City,Practice State,Practice ZIP,Practice Phone,Practice Fax
John,Smith,1234567890,Optometry,john.smith@example.com,555-1234,Vision Care Center,123 Main St,Portland,OR,97201,555-1000,555-1001
Jane,Doe,2345678901,Ophthalmology,jane.doe@example.com,555-2345,Eye Associates,456 Oak Ave,Seattle,WA,98101,555-2000,555-2001
```

A sample template is available for download in the import modal.

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
