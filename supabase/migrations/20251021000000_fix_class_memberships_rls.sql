-- Fix RLS policies for class_memberships table
-- Only allow access if you are the teacher of the class or if you are a member of the class

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Enable read access for class members" ON class_memberships;
DROP POLICY IF EXISTS "Enable insert access for class members" ON class_memberships;
DROP POLICY IF EXISTS "Enable delete access for class members" ON class_memberships;

-- SELECT: Teachers can view memberships in their classes OR students can view memberships in classes they belong to
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
  -- User is a member of the class
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- INSERT: Only students can join classes (insert their own membership)
CREATE POLICY "Students can join classes"
ON class_memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert their own membership
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
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
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
  )
);
