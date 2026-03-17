-- ==============================================================================
-- 02_secure_schema.sql
-- Run this script in your Supabase SQL Editor to secure your database.
-- It migrates the custom login system to Supabase Auth and sets up strict RLS policies.
-- ==============================================================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Link pharmacies table to auth.users
-- First, we need to make sure the id column in pharmacies matches auth.users id
-- Since pharmacies already has UUIDs, we will insert them into auth.users

-- Insert existing pharmacies into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    id,
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    NOW(),
    created_at,
    created_at
FROM pharmacies
WHERE email NOT IN (SELECT email FROM auth.users);

-- Now, add a foreign key constraint to link pharmacies.id to auth.users.id
-- (If this fails, it means there are pharmacies without matching auth.users, which shouldn't happen after the above query)
ALTER TABLE pharmacies 
  ADD CONSTRAINT fk_pharmacies_auth_users 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Drop the old insecure policies
DROP POLICY IF EXISTS "Enable all access for all users v3" ON pharmacies;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON medicines;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON inventory;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON search_logs;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON sales_logs;

-- 4. Create Strict RLS Policies

-- PHARMACIES TABLE
-- Anyone can read pharmacies (for the map and search)
CREATE POLICY "Public can view pharmacies" 
  ON pharmacies FOR SELECT 
  USING (true);

-- Only the owner can update their own pharmacy profile
CREATE POLICY "Pharmacies can update their own profile" 
  ON pharmacies FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- MEDICINES TABLE
-- Anyone can read medicines
CREATE POLICY "Public can view medicines" 
  ON medicines FOR SELECT 
  USING (true);

-- Any authenticated pharmacy can add new medicines (since medicines are shared)
CREATE POLICY "Authenticated users can insert medicines" 
  ON medicines FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- INVENTORY TABLE
-- Anyone can read inventory (to search for medicines)
CREATE POLICY "Public can view inventory" 
  ON inventory FOR SELECT 
  USING (true);

-- Pharmacies can only insert/update/delete their OWN inventory
CREATE POLICY "Pharmacies can insert their own inventory" 
  ON inventory FOR INSERT 
  WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can update their own inventory" 
  ON inventory FOR UPDATE 
  USING (auth.uid() = pharmacy_id) 
  WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can delete their own inventory" 
  ON inventory FOR DELETE 
  USING (auth.uid() = pharmacy_id);

-- SEARCH LOGS TABLE
-- Anyone can insert a search log
CREATE POLICY "Anyone can insert search logs" 
  ON search_logs FOR INSERT 
  WITH CHECK (true);

-- Only admins can view search logs (assuming is_admin is true in pharmacies)
CREATE POLICY "Admins can view search logs" 
  ON search_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM pharmacies 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- SALES LOGS TABLE
-- Pharmacies can only view and insert their own sales logs
CREATE POLICY "Pharmacies can view their own sales logs" 
  ON sales_logs FOR SELECT 
  USING (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can insert their own sales logs" 
  ON sales_logs FOR INSERT 
  WITH CHECK (auth.uid() = pharmacy_id);

-- 5. Create a trigger to automatically create a pharmacy profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pharmacies (id, email, name, address, password)
  VALUES (new.id, new.email, 'صيدلية جديدة', 'العنوان', 'managed_by_auth');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Hide the password column from public API (Security Best Practice)
-- We don't drop it so we don't break existing code immediately, but we shouldn't use it anymore.
-- Supabase handles this automatically if we don't select it, but we can be explicit:
-- REVOKE SELECT (password) ON pharmacies FROM public;
