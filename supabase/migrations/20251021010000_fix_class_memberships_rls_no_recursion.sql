-- Fix RLS policies for class_memberships table to avoid infinite recursion
-- Use auth.uid() directly instead of querying profiles table

-- Drop the policies that cause recursion
DROP POLICY IF EXISTS "Teachers and students can view class memberships" ON class_memberships;
DROP POLICY IF EXISTS "Students can join classes" ON class_memberships;
DROP POLICY IF EXISTS "Teachers can remove students and students can leave classes" ON class_memberships;

-- SELECT: Teachers can view memberships in their classes OR students can view memberships in classes they belong to
-- Avoid recursion by using auth.uid() directly with profile_id relationship
CREATE POLICY "Teachers and students can view class memberships"
ON class_memberships FOR SELECT
TO authenticated
USING (
  -- User is the teacher of the class
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
  OR
  -- User's profile matches the membership profile_id
  -- We check profile.user_id = auth.uid() without triggering profile RLS
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Only students can join classes (insert their own membership)
-- Check that the profile_id being inserted belongs to the current user
CREATE POLICY "Students can join classes"
ON class_memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert membership for their own profile
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Teachers can remove students from their classes OR students can leave classes (delete their own membership)
CREATE POLICY "Teachers can remove students and students can leave classes"
ON class_memberships FOR DELETE
TO authenticated
USING (
  -- User is the teacher of the class
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
  OR
  -- User is removing their own membership
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);
