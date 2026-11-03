create extension if not exists pgcrypto;

-- Add join code columns to classes table
ALTER TABLE classes ADD COLUMN join_code TEXT UNIQUE;

-- Function to generate random join codes (8 characters, alphanumeric)
CREATE OR REPLACE FUNCTION generate_join_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate join codes for new classes
CREATE OR REPLACE FUNCTION ensure_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code = generate_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_join_code
  BEFORE INSERT ON classes
  FOR EACH ROW EXECUTE FUNCTION ensure_join_code();

-- Generate join codes for existing classes
UPDATE classes SET join_code = generate_join_code() WHERE join_code IS NULL;

-- Allow students to view basic class info by join code for joining
CREATE POLICY "Students can view class info for joining"
ON classes FOR SELECT
USING (
  join_code IS NOT NULL
);
