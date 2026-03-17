-- ==============================================================================
-- 04_fix_identities.sql
-- Run this script in your Supabase SQL Editor to fix the "Database error querying schema"
-- ==============================================================================

-- 1. Create missing identities for the manually inserted users
-- Supabase Auth (GoTrue) requires every user to have a corresponding row in auth.identities
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id, 'email', email),
    'email',
    id::text,
    created_at,
    created_at,
    updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);

-- 2. Ensure raw_app_meta_data has the correct provider info
UPDATE auth.users
SET raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE raw_app_meta_data IS NULL OR raw_app_meta_data = '{}'::jsonb;

-- 3. Ensure raw_user_meta_data is an empty JSON object (not null)
UPDATE auth.users
SET raw_user_meta_data = '{}'::jsonb
WHERE raw_user_meta_data IS NULL;

-- 4. Fix any other potentially null boolean columns that GoTrue expects
UPDATE auth.users SET is_super_admin = false WHERE is_super_admin IS NULL;
UPDATE auth.users SET is_sso_user = false WHERE is_sso_user IS NULL;

-- 5. Notify PostgREST to reload the schema cache just in case
NOTIFY pgrst, 'reload schema';
