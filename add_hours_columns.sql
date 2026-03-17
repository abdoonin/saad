-- Run this SQL command in your Supabase SQL Editor to add the new columns for automatic working hours

ALTER TABLE pharmacies
ADD COLUMN opening_time TEXT,
ADD COLUMN closing_time TEXT;
