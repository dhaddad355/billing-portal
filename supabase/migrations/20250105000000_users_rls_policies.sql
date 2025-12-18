-- Migration: Add RLS policies for users table
-- Description: The users table had RLS enabled but no policies, which could prevent inserts

-- Service role policies (for API routes using service role key)
CREATE POLICY "Service role full access to users"
    ON users FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view all users
CREATE POLICY "Authenticated users can view users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Note: Only service role can insert/update users (happens during Azure AD sign-in)
