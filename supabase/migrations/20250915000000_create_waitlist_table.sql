-- Create waitlist table for collecting emails
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into waitlist (anonymous users)
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only behu@ek.dk can view waitlist entries
CREATE POLICY "Only behu@ek.dk can view waitlist"
ON waitlist FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'behu@ek.dk');

-- Only behu@ek.dk can delete waitlist entries
CREATE POLICY "Only behu@ek.dk can delete waitlist"
ON waitlist FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'behu@ek.dk');

-- Add index for email for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email 
ON waitlist USING btree (email);

-- Add index for created_at for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at 
ON waitlist USING btree (created_at);
