# Laser Eye Institute Billing Portal

A secure billing portal built with Next.js 14 (App Router) that enables:
- Staff to review and manage patient statements
- Patients to view and pay their statements via secure shortcode links

## Features

- **Azure AD Authentication**: Staff must sign in with LEI Azure AD accounts
- **Statement Management**: Review, send, or reject pending statements
- **SMS/Email Notifications**: Automatically send statement links via Twilio (SMS) and Postmark (email)
- **Patient Portal**: Secure DOB verification before viewing statements
- **PDF Storage**: Statements stored in Supabase Storage with signed URL access
- **Audit Trail**: Complete logging of all statement events

## Architecture

- **Frontend/Backend**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for PDFs
- **Authentication**: NextAuth.js with Azure AD provider
- **SMS**: Twilio
- **Email**: Postmark
- **UI**: Custom components based on ShadCN/Tailwind CSS

## Route Structure

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/app/dashboard` | Staff (Azure AD) | Statement management dashboard |
| `/app/statements/[id]` | Staff (Azure AD) | Statement detail view |
| `/view/[shortcode]` | Public (DOB gated) | Patient statement view |
| `/api/statement` | API Key | Inbound endpoint for .NET app |
| `/api/app/**` | Staff (Azure AD) | Staff API endpoints |
| `/api/view/**` | Public | Patient view API endpoints |

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Key for Statement Ingestion (from .NET app)
STATEMENT_INGEST_API_KEY=your_statement_ingest_api_key

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your_azure_ad_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret
AZURE_AD_TENANT_ID=your_azure_ad_tenant_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://bill.lasereyeinstitute.com

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Postmark Configuration (for Email)
POSTMARK_API_TOKEN=your_postmark_api_token
POSTMARK_FROM_EMAIL=billing@lasereyeinstitute.com
```

## Database Setup

1. Create a Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Create a storage bucket named `statements` (private)
4. Optionally run `supabase/migrations/002_storage_policies.sql` for storage policies

**For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)**

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This app is designed to be deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

### Azure AD Setup

1. Create an app registration in Azure AD (LEI tenant)
2. Set redirect URL: `https://bill.lasereyeinstitute.com/api/auth/callback/azure-ad`
3. Configure scopes: `openid profile email`
4. Enforce single-tenant (LEI only)

## API Endpoints

### POST /api/statement

Accepts statements from the .NET StatementProcessor app.

**Headers:**
- `x-api-key`: Your STATEMENT_INGEST_API_KEY

**Body (multipart/form-data):**
- `statement_date`, `person_id`, `account_number_suffix`, `account_number_full`
- `cell_phone`, `email_address`, `last_statement_date`, `last_pay_date`
- `next_statement_date`, `last_name`, `first_name`, `patient_balance`
- `statement_pdf`: PDF file

**Body (application/json):**
- Same fields plus `pdf_base64`: Base64-encoded PDF

### POST /api/view/verify-dob

Verifies patient DOB for statement access.

**Body:**
```json
{
  "short_code": "ABC123",
  "dob": "MM/DD/YYYY"
}
```

## Security Considerations

- No PHI in URLs or logs
- SMS/email content minimal (no DOB or diagnosis)
- All traffic over HTTPS
- Azure AD restricted to LEI tenant
- API key required for statement ingestion
- DOB verification before patient access
- Signed URLs for PDF downloads (5-minute expiry)
