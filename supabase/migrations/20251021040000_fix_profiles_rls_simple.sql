-- Fix infinite recursion by using SECURITY DEFINER function for profiles check
-- This allows class_memberships policies to check profiles without triggering recursion

-- Drop ALL existing policies on profiles (including ones created in dashboard)
DROP POLICY IF EXISTS "Enable read access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view class member basics" ON profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile (if needed)
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
