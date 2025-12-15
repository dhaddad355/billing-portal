# app.mylei.com Instructions
Internal enterprise application for patient exam management, billing, and referrals.

## Stack
- NextJS, Supabase, Typescript, ShadCN

## Dev environment tips
- Prefer `pnpm` over `npm`
- Write clean, maintainable, and scalable code
- Ensure typecheck passes

## Database
- If db changes are required always generate a migration file, add or update a base schema file, and generate a sample seed file for testing.
- Supabase DB migrations must follow the format: `YYYYMMDDHHmmss_short_description.sql`
- When creating a new table, you MUST enable Row Level Security (RLS) even if the table is intended for public access.
- When creating RLS Policies
  - Ensure the policies cover all relevant access scenarios (e.g. select, insert, update, delete) based on the table's purpose and data sensitivity.
  - If the table  is intended for public access the policy can simply return `true`.
  - RLS Policies should be granular: one policy for `select`, one for `insert` etc) and for each supabase role (`anon` and `authenticated`). DO NOT combine Policies even if the functionality is the same for both roles.
  - Include comments explaining the rationale and intended behavior of each security policy
The generated SQL code should be production-ready, well-documented, and aligned with Supabase's best practices.

## NextGen Data API
NextGen, NG, or NG Enterprise EHR/EMR provides an API to access patient and person data. Core concepts: A person may have a chart. A chart containers encounter. An encounter represents one single visit and may have many documents.

### Authentication
- NextGen or NG is our patient database provider.
- The GSA OAuth2 client_credentials grant issues you an auth token.
- With a valid token you can GET /master/practices route to obtain the practice ID and Enterprise ID
- The PUT /login-defaults response “body” only contains a status code, whereas the crucial X-NG-SessionId value will be returned within the response header (header name is also x-ng-sessionid).
- The X-NG-SessionId is not a true jsessionid, but rather a 2nd “key” (the 1st being the token) needed to call data from a given Enterprise+Practice combination – each X-NG-SessionId encodes the data you submit via the json body in your call to PUT /login-defaults.
- X-NG-SessionId values are not dynamic, meaning they will remain constant given the same input values; they also do not expire – therefore you can store each client’s set of in-scope X-NG-SessionId values in a config file, etc. There is no need to update the X-NG-SessionId once you’ve established that value for a given combination of login-defaults
- Some of these values are stored in .env

To make Enterprise API calls, perform the following procedure:

1. From your application, make an HTTPS POST request to the GSA Authentication /token endpoint detailed above using the Client Credentials grant_type.
2. Obtain and use access_token in headers as Authorization: Bearer {access_token_value} in all subsequent routes. Tokens expire in 1 hour. Refresh tokens are not supported under GSA Authentication.
3. Set login defaults and represent them as the value of a X-NG-SessionId header in all subsequent routes as per the sequence diagrams and documentation on the following pages.

- API endpoints for GSA Authentication:
  - GSA OAuth2 Base URL: `https://nativeapi.nextgen.com/nge/prod/nge-oauth`
  - GSA /token Endpoint: `https://nativeapi.nextgen.com/nge/prod/nge-oauth/token`
  - Enterprise API Base URL and Endpoint
- Example:
  - Base URL: `https://nativeapi.nextgen.com/nge/prod/nge-api/api`
  - Example Endpoint: /users/me/login-defaults
  - Base URL + Endpoint: `https://nativeapi.nextgen.com/nge/prod/nge-api/api/users/me/login-defaults`

Sample API Auth Call:
```
curl --location --request POST 'https://nativeapi.nextgen.com/nge/prod/nge-oauth/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=YOUR_CLIENT_ID' \
--data-urlencode 'client_secret=YOUR_CLIENT_SECRET' \
--data-urlencode 'site_id=TARGET_SITE_ID'
```
### Person Routes

- A person is a core object in NG. Each Person has an ID. Fetch the ID by performing a person lookup: GET /persons/lookup
- This route does not allow use of the OData $filter parameter.
- This lookup route returns results matching a number of specific parameters (e.g. firstName, lastName, dateOfBirth, etc) as detailed in the route's technical documentation.
- Use of multiple criteria is allowed; the GET /persons/lookup route will logically join each parameter with AND.
- The exception is the use of the QuickSearchId & QuickSearchInput query parameters, which must both be used together - this will cause the API to ignore all other lookup parameters.
- Accepted values for QuickSearchId are PersonNumber, MedicalRecordNumber, OtherIdNumber, SocialSecurityNumber, and PhoneNumber.
- The value of QuickSearchInput must be the lookup value corresponding to the data type specified in QuickSearchId.
- For example, if QuickSearchId=PhoneNumber, the value of QuickSearchInput must be a 10 digit integer.
- Note that using QuickSearchId=PhoneNumber will return all person records where at least one phone number field (e.g. homePhone, cellPhone, alternatePhone, dayPhone, etc.) matches the value of QuickSearchInput.
- Base demographics will be returned. For a complete demographic record, GET /persons/{personId} must be called with the retrieved id from the GET /persons/lookup response.
- Consider supplying the ExcludeExpired=false Query Parameter to filter out any Expired/Deceased Patients.
- see `ng-api\person.json` for details

### Encounters
- Get all encounters for a person GET /persons/{personId}/chart/encounters
- Get details about one encounter: GET /persons/{personId}/chart/encounters/{encounterId}
- see `ng-api\chart.json` for details

### Appointments
- GET /appointments for all appointments for the next 7 days.
- see `ng-api\appointments.json` for details

## Testing instructions
- Add or update tests for the code you change, even if nobody asked.

## PR instructions
- Title format: [<project_name>] <Title>
- Always run `pnpm lint` and `pnpm test` before committing.