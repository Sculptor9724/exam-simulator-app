-- Create allowlist table for users who can sign up
CREATE TABLE signup_allowed_emails (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT signup_allowed_emails_email_not_blank CHECK (LENGTH(TRIM(email)) > 0)
);

-- Enforce case-insensitive uniqueness while keeping the stored email readable
CREATE UNIQUE INDEX signup_allowed_emails_email_lower_idx
ON signup_allowed_emails (LOWER(TRIM(email)));

-- Enable RLS
ALTER TABLE signup_allowed_emails ENABLE ROW LEVEL SECURITY;

-- Let the app check a single email without exposing the allowlist table to anonymous users
CREATE OR REPLACE FUNCTION is_signup_email_allowed(signup_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM signup_allowed_emails
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(signup_email))
  );
$$;

REVOKE ALL ON FUNCTION is_signup_email_allowed(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_signup_email_allowed(TEXT) TO anon, authenticated;
