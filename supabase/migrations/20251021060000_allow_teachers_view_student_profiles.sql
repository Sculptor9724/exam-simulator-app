-- Allow teachers to view profiles of students in their classes
-- Uses SECURITY DEFINER function to avoid recursion

-- Create a function to check if user is a teacher of a profile's student
CREATE OR REPLACE FUNCTION public.is_teacher_of_profile(profile_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    JOIN public.class_memberships ON class_memberships.class_id = classes.id
    WHERE classes.user_id = auth.uid()
    AND class_memberships.profile_id = profile_uuid
  );
$$;

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new policy: users can see their own profile OR teachers can see their students' profiles
CREATE POLICY "Users can view own profile and teachers can view students"
ON profiles FOR SELECT
TO authenticated
USING (
  -- User can see their own profile
  auth.uid() = user_id
  OR
  -- User is a teacher of this profile's student (using security definer - no recursion!)
  public.is_teacher_of_profile(id)
);
