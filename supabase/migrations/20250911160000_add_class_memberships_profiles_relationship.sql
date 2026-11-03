-- Add foreign key relationship between class_memberships and profiles
-- This allows Supabase to understand the relationship for joins

-- Add foreign key constraint from class_memberships.user_id to profiles.user_id
ALTER TABLE class_memberships 
ADD CONSTRAINT class_memberships_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Create index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_class_memberships_user_id ON class_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
