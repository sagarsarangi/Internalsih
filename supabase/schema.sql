-- Smart Helmet (PS-06) / SIH - Supabase Database Schema Migration
-- Table: incidents
-- RLS & Realtime configuration per ARCHITECTURE.md §3 & §7
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create incidents table (with sparse alert recipient columns)
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  victim_name TEXT,
  telegram TEXT,
  email TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status = 'confirmed'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration statement if updating existing table:
-- ALTER TABLE public.incidents
--   ADD COLUMN IF NOT EXISTS victim_name TEXT,
--   ADD COLUMN IF NOT EXISTS telegram TEXT,
--   ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Create index for descending timestamp queries (newest-first)
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at_desc 
ON public.incidents (occurred_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 5. Public read-only policy for anon and authenticated users
DROP POLICY IF EXISTS "Allow public read-only access to incidents" ON public.incidents;
CREATE POLICY "Allow public read-only access to incidents" 
ON public.incidents 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Note: No INSERT / UPDATE / DELETE policies are created because all writes 
-- are performed server-side via the Supabase service-role client, which bypasses RLS.

-- 6. Enable Realtime Replication for the incidents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
