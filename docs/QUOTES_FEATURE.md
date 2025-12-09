# Quote Feature Documentation

## Overview

The Quote feature allows staff to create, view, and manage patient treatment quotes for laser eye procedures. The feature includes configurable pricing, discounts, add-ons, and financing options.

## Features

### 1. Quote Management
- Create quotes for patients with bilateral eye treatment options
- View list of all quotes with search functionality
- View detailed quote information
- Delete quotes

### 2. Treatment Configuration
Each eye can be configured independently with:
- **Refractive Error**: Myopia, Hyperopia, or Presbyopia
- **Astigmatism**: Yes/No
- **Treatment Type**: LASIK, PRK, SMILE, ICL, or RLE

### 3. Pricing Rules

#### Base Pricing
Prices are determined by a pricing grid based on:
- Treatment type
- Refractive error
- Astigmatism status

Each combination has a unique price that can be configured in Settings.

#### Bilateral Discount
- Automatically applied when both eyes are treated
- Configurable percentage (default: 10%)
- Applied before custom discounts

#### Custom Discounts
- Configurable named discounts (e.g., "Military Discount 10%")
- Applied to the subtotal after bilateral discount
- Optional per quote

#### Add-Ons
- Configurable per-patient add-ons
- Examples: Monovision (free), Lifetime Enhancements ($500), Workup Charge ($250)
- Added to the final total

### 4. Payment Options

#### Scheduling Deposit
- Configurable percentage of total (default: 20%)
- Due upon scheduling

#### Balance Due Payment Plans
1. **Single Payment**: Full balance due amount
2. **24-Month Plan**: 0% interest financing
3. **36-Month Plan**: Interest-based (default: 12.99% APR)
4. **60-Month Plan**: Interest-based (default: 15.99% APR)

### 5. Settings Management

#### Pricing Grid
- Edit individual prices for each treatment/refractive error/astigmatism combination
- Changes apply to all new quotes

#### Discounts
- Add new named discounts with percentage
- Delete existing discounts
- Active/inactive status management

#### Add-Ons
- Add new add-ons with prices
- Delete existing add-ons
- Active/inactive status management

#### Financing Settings
- Bilateral discount percentage
- Scheduling deposit percentage
- 36-month interest rate (APR)
- 60-month interest rate (APR)

## Database Schema

### Tables

#### `pricing_grid`
Stores base prices for treatment combinations.

#### `quote_discounts`
Configurable discount options.

#### `quote_addons`
Configurable add-on services.

#### `quote_financing_settings`
Financing configuration including interest rates and percentages.

#### `quotes`
Patient quotes with treatment selections and calculated pricing.

#### `quote_selected_addons`
Junction table linking quotes to selected add-ons.

## API Endpoints

### Quotes
- `GET /api/app/quotes` - List all quotes (with pagination and search)
- `POST /api/app/quotes` - Create a new quote
- `GET /api/app/quotes/[id]` - Get a specific quote
- `PUT /api/app/quotes/[id]` - Update a quote
- `DELETE /api/app/quotes/[id]` - Delete a quote

### Settings
- `GET /api/app/quotes/settings` - Get all quote settings
- `PUT /api/app/quotes/settings/pricing` - Update pricing grid item
- `POST /api/app/quotes/settings/discounts` - Add discount
- `PUT /api/app/quotes/settings/discounts` - Update discount
- `DELETE /api/app/quotes/settings/discounts` - Delete discount
- `POST /api/app/quotes/settings/addons` - Add add-on
- `PUT /api/app/quotes/settings/addons` - Update add-on
- `DELETE /api/app/quotes/settings/addons` - Delete add-on
- `PUT /api/app/quotes/settings/financing` - Update financing setting

## UI Pages

### `/app/quotes`
Lists all quotes with:
- Search by patient name or MRN
- Pagination
- Quick view of treatment details and total cost

### `/app/quotes/new`
Create a new quote with:
- Patient information form
- Right eye configuration
- Left eye configuration
- Discount selection
- Add-ons selection
- Real-time pricing calculation
- Payment options preview

### `/app/quotes/[id]`
View quote details including:
- Patient information
- Treatment details for both eyes
- Pricing breakdown with all discounts and add-ons
- Payment options with monthly amounts
- Delete option

### `/app/quotes/settings`
Manage all quote settings:
- Edit pricing grid
- Manage discounts
- Manage add-ons
- Configure financing settings

## Usage Workflow

### Creating a Quote

1. Navigate to **Quotes > New Quote**
2. Enter patient name and MRN
3. Configure right eye:
   - Select refractive error
   - Check astigmatism if applicable
   - Select treatment type
   - Price displays automatically
4. Configure left eye (same process)
5. Optionally select a discount
6. Optionally select add-ons
7. Review pricing summary and payment options
8. Click "Create Quote"

### Managing Settings

1. Navigate to **Quotes > Quote Settings**
2. **Pricing Grid**: Click "Edit" on any row to change price
3. **Discounts**: Add new discounts or delete existing ones
4. **Add-Ons**: Add new add-ons or delete existing ones
5. **Financing Settings**: Update percentages and interest rates

## Calculation Examples

### Example 1: Basic Quote
- Right Eye: LASIK, Myopia, No Astigmatism = $2,500
- Left Eye: LASIK, Myopia, No Astigmatism = $2,500
- Subtotal: $5,000
- Bilateral Discount (10%): -$500
- **Total: $4,500**
- Scheduling Deposit (20%): $900
- **Balance Due: $3,600**

### Example 2: With Discount and Add-Ons
- Right Eye: LASIK, Myopia, With Astigmatism = $2,750
- Left Eye: LASIK, Myopia, With Astigmatism = $2,750
- Subtotal: $5,500
- Bilateral Discount (10%): -$550
- Subtotal after bilateral: $4,950
- Military Discount (10%): -$495
- Add-Ons: Lifetime Enhancements = +$500
- **Total: $4,955**
- Scheduling Deposit (20%): $991
- **Balance Due: $3,964**

### Payment Options (for $3,964 balance)
- Single Payment: $3,964
- 24-Month (0%): $165.17/month
- 36-Month (12.99% APR): $133.46/month
- 60-Month (15.99% APR): $95.96/month

## Installation

### 1. Database Migration
Run the migration file:
```bash
# Apply the quotes schema migration
psql -d your_database -f supabase/migrations/20250109000000_quotes_schema.sql

# Load seed data
psql -d your_database -f supabase/seeds/quotes_seed.sql
```

### 2. Navigation
The sidebar navigation is automatically updated to include:
- New Quote
- View Quotes
- Quote Settings

## Future Enhancements

Potential improvements not included in this initial implementation:

1. **PDF Generation**: Generate printable treatment plan PDFs
2. **Email Quotes**: Send quotes directly to patients via email
3. **Quote Versions**: Track changes to quotes over time
4. **Approval Workflow**: Require manager approval for large discounts
5. **Quote Expiration**: Set expiration dates on quotes
6. **Payment Tracking**: Link quotes to actual payments
7. **Toast Notifications**: Replace alert() calls with proper toast notifications
8. **Quote Templates**: Save common configurations as templates
9. **Multi-currency Support**: Support for currencies other than USD
10. **Quote Analytics**: Dashboard showing quote conversion rates

## Security Considerations

- All API endpoints require authentication via NextAuth
- Row Level Security (RLS) policies are enabled on all tables
- Service role is used for API operations
- No PHI (Protected Health Information) in URLs or logs
- All database queries use parameterized queries (via Supabase client)

## Testing

Before deploying to production:

1. Test quote creation with various combinations
2. Verify pricing calculations are correct
3. Test bilateral discount application
4. Test custom discount application
5. Test add-on selections
6. Test payment calculations
7. Verify settings CRUD operations work correctly
8. Test search and pagination on quotes list
9. Test quote deletion
10. Verify proper error handling

## Troubleshooting

### Prices not appearing
- Check that pricing grid is populated with seed data
- Verify the exact combination of treatment/refractive error/astigmatism exists in pricing grid
- Check browser console for API errors

### Settings changes not taking effect
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check that the update API call succeeded
- Verify database changes were committed

### Build errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript types are correct
- Run linter: `npm run lint`
- Build locally: `npm run build`

## Support

For issues or questions, please contact the development team or create an issue in the repository.
