-- IMPORTANT: Run this entire script in Supabase SQL Editor to fix RLS policies

-- Step 1: Create Tables (if they don't exist)

-- Pharmacies Table
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_open BOOLEAN DEFAULT true,
  opening_time TEXT,
  closing_time TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_name TEXT NOT NULL,
  scientific_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(pharmacy_id, medicine_id)
);

-- Search Logs Table for Analytics
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Sales Logs Table
CREATE TABLE IF NOT EXISTS sales_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 2: Add missing columns if tables already exist
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS opening_time TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS closing_time TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Fix Policies
-- We drop ALL potential previous policies (v1, v2) to ensure a clean slate.

-- 3.1 Pharmacies Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON pharmacies;
DROP POLICY IF EXISTS "Enable insert for all users" ON pharmacies;
DROP POLICY IF EXISTS "Enable update for all users" ON pharmacies;
DROP POLICY IF EXISTS "Enable delete for all users" ON pharmacies;
DROP POLICY IF EXISTS "Enable all access for all users" ON pharmacies;
DROP POLICY IF EXISTS "Enable all access for all users v2" ON pharmacies;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON pharmacies;

-- Create one master policy for Pharmacies (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Enable all access for all users v3" ON pharmacies FOR ALL USING (true) WITH CHECK (true);

-- 3.2 Medicines Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON medicines;
DROP POLICY IF EXISTS "Enable insert for all users" ON medicines;
DROP POLICY IF EXISTS "Enable update for all users" ON medicines;
DROP POLICY IF EXISTS "Enable all access for all users" ON medicines;
DROP POLICY IF EXISTS "Enable all access for all users v2" ON medicines;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON medicines;

-- Create one master policy for Medicines
CREATE POLICY "Enable all access for all users v3" ON medicines FOR ALL USING (true) WITH CHECK (true);

-- 3.3 Inventory Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory;
DROP POLICY IF EXISTS "Enable insert for all users" ON inventory;
DROP POLICY IF EXISTS "Enable update for all users" ON inventory;
DROP POLICY IF EXISTS "Enable delete for all users" ON inventory;
DROP POLICY IF EXISTS "Enable all access for all users" ON inventory;
DROP POLICY IF EXISTS "Enable all access for all users v2" ON inventory;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON inventory;

-- Create one master policy for Inventory
CREATE POLICY "Enable all access for all users v3" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- 3.4 Search Logs Policies
DROP POLICY IF EXISTS "Enable all access for all users v3" ON search_logs;
CREATE POLICY "Enable all access for all users v3" ON search_logs FOR ALL USING (true) WITH CHECK (true);

-- 3.5 Sales Logs Policies
DROP POLICY IF EXISTS "Enable all access for all users v3" ON sales_logs;
CREATE POLICY "Enable all access for all users v3" ON sales_logs FOR ALL USING (true) WITH CHECK (true);


-- Step 5: Insert Mock Data (Only if empty)
-- We insert with specific UUIDs if possible, or just rely on email uniqueness to prevent dupes.

INSERT INTO pharmacies (name, address, phone, is_open, email, password, latitude, longitude)
SELECT 'صيدلية النهضة', 'الرياض - حي الملز', '0114777777', true, 'nahda@saad.com', '123456', 24.6675, 46.7369
WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE email = 'nahda@saad.com');

INSERT INTO pharmacies (name, address, phone, is_open, email, password, latitude, longitude)
SELECT 'صيدلية الدواء', 'جدة - شارع فلسطين', '0126666666', true, 'aldawaa@saad.com', '123456', 21.5235, 39.1764
WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE email = 'aldawaa@saad.com');

INSERT INTO pharmacies (name, address, phone, is_open, email, password, latitude, longitude)
SELECT 'صيدلية المجتمع', 'الدمام - حي الشاطئ', '0138888888', false, 'community@saad.com', '123456', 26.4468, 50.1118
WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE email = 'community@saad.com');

-- Add Medicines
INSERT INTO medicines (trade_name, scientific_name)
SELECT 'Panadol Extra', 'Paracetamol 500mg + Caffeine'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE trade_name = 'Panadol Extra');

INSERT INTO medicines (trade_name, scientific_name)
SELECT 'Brufen 400', 'Ibuprofen'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE trade_name = 'Brufen 400');

INSERT INTO medicines (trade_name, scientific_name)
SELECT 'Augmentin 1g', 'Amoxicillin + Clavulanic Acid'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE trade_name = 'Augmentin 1g');