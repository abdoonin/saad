-- ==============================================================================
-- 05_fix_gotrue_permissions.sql
-- Run this script in your Supabase SQL Editor to fix the "Database error querying schema"
-- ==============================================================================

-- The error "Database error querying schema" during login is caused by the foreign key 
-- we added from `public.pharmacies` to `auth.users`. 
-- When Supabase Auth (GoTrue) tries to update the `last_sign_in_at` column upon login, 
-- PostgreSQL checks the foreign key. However, the internal `supabase_auth_admin` role 
-- does not have permission to read `public.pharmacies`, causing the update to fail!

-- 1. Drop the problematic foreign key constraint
ALTER TABLE public.pharmacies DROP CONSTRAINT IF EXISTS fk_pharmacies_auth_users;

-- 2. Grant necessary permissions to the auth admin role so it can interact with public schema if needed
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pharmacies TO supabase_auth_admin;

-- 3. Drop the trigger we created earlier, as triggers on auth.users can also cause this error 
-- if they fail or lack permissions during the GoTrue transaction.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Reload the schema cache
NOTIFY pgrst, 'reload schema';
