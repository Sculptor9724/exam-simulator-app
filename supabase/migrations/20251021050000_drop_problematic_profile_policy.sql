-- Drop the problematic profile policy that queries class_memberships
-- This policy was likely created in the dashboard and causes infinite recursion

DROP POLICY IF EXISTS "Teachers can view class member basics" ON profiles;
