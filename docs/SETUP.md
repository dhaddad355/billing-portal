# MyLEI Portal Setup Guide

Complete setup guide for deploying the Laser Eye Institute MyLEI Portal with Supabase, Azure AD, and Vercel.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supabase Setup](#supabase-setup)
3. [Azure AD Configuration](#azure-ad-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Security & Authentication Flow](#security--authentication-flow)

---

## Architecture Overview

### Why Supabase?

This application uses Supabase for:

1. **PostgreSQL Database** - Stores users, persons, statements, messages, and audit events
2. **Storage Bucket** - Stores PDF statement files securely with signed URL access
3. **Row Level Security (RLS)** - Database-level security policies (enabled but bypassed via service role)

### Authentication Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Staff User    │────▶│   Azure AD      │────▶│   NextAuth.js   │
│  (LEI Tenant)   │     │   (OAuth2)      │     │   (JWT Session) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   .NET App      │────▶│   API Key       │────▶│  Next.js API    │
│ (Statement      │     │   (x-api-key)   │     │   Routes        │
│  Processor)     │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐                             ┌─────────────────┐
│   Patient       │────▶ DOB Verification ────▶│   Supabase      │
│  (Public)       │                             │   (Service Key) │
└─────────────────┘                             └─────────────────┘
```

### Data Flow

1. **.NET StatementProcessor** → Posts statements to `/api/statement` with API key
2. **Staff Dashboard** → Authenticated via Azure AD, accesses data through API routes
3. **Patient View** → Public access with DOB verification, then signed PDF URLs

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys from Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Run Database Migration

Navigate to SQL Editor in Supabase dashboard and run the migration:

```sql
-- Copy contents from: supabase/migrations/001_initial_schema.sql
```

Or use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Step 3: Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Click "New bucket"
3. Name: `statements`
4. **Public bucket**: OFF (private)
5. Click "Create bucket"

### Step 4: Configure Storage Policies (Optional)

Since we use the service role key for all storage operations, RLS is bypassed. However, you can add policies for additional security:

```sql
-- Allow service role to manage all files
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (auth.role() = 'service_role');
```

---

## Azure AD Configuration

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. Click "App registrations" → "New registration"
3. Configure:
   - **Name**: `MyLEI Portal`
   - **Supported account types**: "Accounts in this organizational directory only (Single tenant)"
   - **Redirect URI**: Web → `https://bill.lasereyeinstitute.com/api/auth/callback/azure-ad`

### Step 2: Configure Authentication

1. Go to "Authentication" in your app registration
2. Add platform → Web
3. Redirect URIs:
   - Production: `https://bill.lasereyeinstitute.com/api/auth/callback/azure-ad`
   - Development: `http://localhost:3000/api/auth/callback/azure-ad`
4. Enable "ID tokens" under Implicit grant

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description and expiry
4. **Copy the secret value immediately** → `AZURE_AD_CLIENT_SECRET`

### Step 4: Note Required Values

From the "Overview" page:
- **Application (client) ID** → `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`

### Step 5: Configure API Permissions

1. Go to "API permissions"
2. Add permissions:
   - Microsoft Graph → Delegated → `openid`
   - Microsoft Graph → Delegated → `profile`
   - Microsoft Graph → Delegated → `email`
3. Click "Grant admin consent"

---

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Select the `billing-portal` directory as the root

### Step 2: Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `billing-portal`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 3: Add Environment Variables

Add all environment variables from `.env.example`:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase → Settings → API |
| `STATEMENT_INGEST_API_KEY` | Custom API key for .NET app | Generate with `openssl rand -base64 32` |
| `AZURE_AD_CLIENT_ID` | Azure app client ID | Azure → App Registration → Overview |
| `AZURE_AD_CLIENT_SECRET` | Azure app client secret | Azure → App Registration → Certificates & secrets |
| `AZURE_AD_TENANT_ID` | Azure tenant ID | Azure → App Registration → Overview |
| `NEXTAUTH_SECRET` | NextAuth encryption key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://bill.lasereyeinstitute.com` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Twilio Console |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Twilio Console |
| `POSTMARK_API_TOKEN` | Postmark server API token | Postmark → Servers → API Tokens |
| `POSTMARK_FROM_EMAIL` | Verified sender email | Postmark → Sender Signatures |

### Step 4: Configure Custom Domain

1. Go to your Vercel project → Settings → Domains
2. Add `bill.lasereyeinstitute.com`
3. Update DNS records as instructed by Vercel

---

## Environment Variables Reference

### `.env.local` (Development)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Statement Ingestion API Key (share with .NET app)
STATEMENT_INGEST_API_KEY=your-generated-api-key

# Azure AD
AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# NextAuth
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12485551234

# Postmark (Email)
POSTMARK_API_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POSTMARK_FROM_EMAIL=mylei@lasereyeinstitute.com
```

---

## Security & Authentication Flow

### How Authentication Works

This application does **NOT** use Supabase Auth. Instead:

1. **Staff Authentication**: Azure AD via NextAuth.js
   - Staff sign in with their LEI Microsoft account
   - NextAuth.js validates the token and creates a JWT session
   - On first login, user is upserted into the `users` table

2. **Database Access**: Service Role Key
   - All database operations use the Supabase service role key
   - This key bypasses Row Level Security (RLS)
   - Only server-side API routes have access to this key

3. **Patient Access**: DOB Verification
   - Patients access via shortcode URL (no login required)
   - DOB verification required before viewing statement
   - PDF access via short-lived signed URLs (5 minutes)

### Why Not Supabase Auth?

Supabase Auth is not used because:

1. **Single Sign-On Requirement**: Staff must use Azure AD (LEI tenant only)
2. **No Patient Accounts**: Patients don't create accounts; they verify with DOB
3. **Centralized Identity**: LEI already has Azure AD as their identity provider

### Database Security Model

```sql
-- RLS is enabled but bypassed by service role
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_events ENABLE ROW LEVEL SECURITY;
```

Since all database access goes through Next.js API routes using the service role key:
- **Staff routes** (`/api/app/**`) are protected by NextAuth.js middleware
- **Patient routes** (`/api/view/**`) are protected by DOB verification
- **Ingestion route** (`/api/statement`) is protected by API key

### PDF Storage Security

PDFs are stored in a private Supabase Storage bucket:

1. Files uploaded via service role (bypasses bucket policies)
2. Access only via signed URLs generated server-side
3. Signed URLs expire after 5 minutes
4. No direct public access to bucket

---

## Troubleshooting

### Common Issues

**Azure AD Login Fails**
- Verify redirect URI matches exactly
- Check that tenant ID is correct
- Ensure API permissions have admin consent

**Supabase Connection Errors**
- Verify URL doesn't have trailing slash
- Check that service role key is correct (not anon key)
- Ensure project is not paused

**PDF Upload Fails**
- Verify storage bucket exists and is named `statements`
- Check file size limits (default 50MB in Supabase)

**SMS/Email Not Sending**
- Verify Twilio/Postmark credentials
- Check that phone numbers are in E.164 format
- Verify sender email is verified in Postmark

---

## Local Development

```bash
# Clone and install
cd billing-portal
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev

# Open http://localhost:3000
```

For Azure AD to work locally, add `http://localhost:3000/api/auth/callback/azure-ad` to your app registration redirect URIs.
