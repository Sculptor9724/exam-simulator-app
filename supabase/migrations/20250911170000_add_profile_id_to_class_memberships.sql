-- Add profile_id column to class_memberships for direct profile reference
-- This creates a cleaner relationship structure

-- Add profile_id column that references profiles.id
ALTER TABLE class_memberships 
ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Populate profile_id based on existing user_id relationships
UPDATE class_memberships 
SET profile_id = profiles.id 
FROM profiles 
WHERE class_memberships.user_id = profiles.user_id;

-- Create index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_class_memberships_profile_id ON class_memberships(profile_id);
