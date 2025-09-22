-- IMMEDIATE FIX for Round Control Issue
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Create round_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS round_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'stopped' CHECK (status IN ('active', 'stopped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on round_config table
ALTER TABLE round_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to round_config" ON round_config;
DROP POLICY IF EXISTS "Allow public write access to round_config" ON round_config;

-- Create RLS policies for round_config table
-- Allow public read access (so users can check round status)
CREATE POLICY "Allow public read access to round_config" ON round_config
    FOR SELECT USING (true);

-- Allow public insert/update access (for admin operations)
CREATE POLICY "Allow public write access to round_config" ON round_config
    FOR ALL USING (true);

-- Insert default configurations
INSERT INTO round_config (round_number, status) VALUES 
(1, 'stopped'),
(2, 'stopped'),
(3, 'stopped')
ON CONFLICT (round_number) DO NOTHING;

-- Verify the setup works
SELECT 
    'SUCCESS: Round config table created with RLS policies!' as message,
    COUNT(*) as total_rounds
FROM round_config;