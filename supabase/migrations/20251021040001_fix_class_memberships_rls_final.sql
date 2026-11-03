-- Fix class_memberships RLS policies using a security definer function to avoid recursion
-- This function bypasses RLS when checking if a profile belongs to the current user

-- Create a security definer function to check profile ownership
-- SECURITY DEFINER means it runs with the privileges of the owner, bypassing RLS
CREATE OR REPLACE FUNCTION public.user_has_profile(profile_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = profile_uuid
    AND user_id = auth.uid()
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can remove students and students can leave classes" ON class_memberships;
DROP POLICY IF EXISTS "Students can join classes" ON class_memberships;
DROP POLICY IF EXISTS "Teachers and students can view class memberships" ON class_memberships;

-- SELECT: Teachers can view memberships in their classes OR students can view memberships in their own classes
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
  -- User owns the profile (using security definer function - no recursion!)
  public.user_has_profile(profile_id)
);

-- INSERT: Students can join classes (insert their own membership)
CREATE POLICY "Students can join classes"
ON class_memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert their own membership (using security definer function)
  public.user_has_profile(profile_id)
);

-- DELETE: Teachers can remove students from their classes OR students can leave classes
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
  -- User is removing their own membership (using security definer function)
  public.user_has_profile(profile_id)
);
