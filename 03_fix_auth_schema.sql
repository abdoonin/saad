-- Fix for "Database error querying schema" in Supabase Auth
-- This happens when manually inserted users have NULL in JSONB columns

UPDATE auth.users 
SET raw_app_meta_data = '{}'::jsonb 
WHERE raw_app_meta_data IS NULL;

UPDATE auth.users 
SET raw_user_meta_data = '{}'::jsonb 
WHERE raw_user_meta_data IS NULL;

UPDATE auth.users
SET is_super_admin = false
WHERE is_super_admin IS NULL;

UPDATE auth.users
SET phone = NULL
WHERE phone = '';
