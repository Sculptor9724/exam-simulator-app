-- Update RLS policies for class_memberships to work with profile_id instead of user_id

-- Drop old policies that reference user_id
DROP POLICY IF EXISTS "Students can view their own memberships" ON class_memberships;
DROP POLICY IF EXISTS "Students can join classes" ON class_memberships;
DROP POLICY IF EXISTS "Students can leave classes" ON class_memberships;
DROP POLICY IF EXISTS "Teachers can view class memberships" ON class_memberships;
DROP POLICY IF EXISTS "Teachers can remove students from their classes" ON class_memberships;

-- Create new policies that work with profile_id

-- Students can view their own memberships (through profile relationship)
CREATE POLICY "Students can view their own memberships"
ON class_memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Students can join classes (insert their own memberships through profile)
CREATE POLICY "Students can join classes"
ON class_memberships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Students can leave classes (delete their own memberships through profile)
CREATE POLICY "Students can leave classes"
ON class_memberships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = class_memberships.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Teachers can view memberships for their classes
CREATE POLICY "Teachers can view class memberships"
ON class_memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
);

-- Teachers can remove students from their classes
CREATE POLICY "Teachers can remove students from their classes"
ON class_memberships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
);
