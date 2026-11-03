-- Make user-owned data cascade from auth.users so backend account deletion can
-- rely on auth.admin.deleteUser(userId) without manual cleanup.
--
-- This migration also cascades through dependent tables so deleting a user's
-- profile, exams, or classes does not fail on downstream foreign keys.

BEGIN;

-- Direct auth.users ownership
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.user_data
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_data
ADD CONSTRAINT user_profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.exams
DROP CONSTRAINT IF EXISTS exams_user_id_fkey;

ALTER TABLE public.exams
ADD CONSTRAINT exams_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.exam_logs
DROP CONSTRAINT IF EXISTS exam_logs_user_id_fkey;

ALTER TABLE public.exam_logs
ADD CONSTRAINT exam_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.exam_ratings
DROP CONSTRAINT IF EXISTS exam_ratings_user_id_fkey;

ALTER TABLE public.exam_ratings
ADD CONSTRAINT exam_ratings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.classes
DROP CONSTRAINT IF EXISTS classes_user_id_fkey;

ALTER TABLE public.classes
ADD CONSTRAINT classes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Downstream dependencies of user-owned records
ALTER TABLE public.class_memberships
DROP CONSTRAINT IF EXISTS class_memberships_profile_id_fkey;

ALTER TABLE public.class_memberships
ADD CONSTRAINT class_memberships_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.class_memberships
DROP CONSTRAINT IF EXISTS class_memberships_class_id_fkey;

ALTER TABLE public.class_memberships
ADD CONSTRAINT class_memberships_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES public.classes(id)
ON DELETE CASCADE;

ALTER TABLE public.class_exams
DROP CONSTRAINT IF EXISTS class_exams_class_id_fkey;

ALTER TABLE public.class_exams
ADD CONSTRAINT class_exams_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES public.classes(id)
ON DELETE CASCADE;

ALTER TABLE public.class_exams
DROP CONSTRAINT IF EXISTS class_exams_exam_id_fkey;

ALTER TABLE public.class_exams
ADD CONSTRAINT class_exams_exam_id_fkey
FOREIGN KEY (exam_id)
REFERENCES public.exams(id)
ON DELETE CASCADE;

ALTER TABLE public.exam_logs
DROP CONSTRAINT IF EXISTS exam_logs_exam_id_fkey;

ALTER TABLE public.exam_logs
ADD CONSTRAINT exam_logs_exam_id_fkey
FOREIGN KEY (exam_id)
REFERENCES public.exams(id)
ON DELETE CASCADE;

ALTER TABLE public.exam_ratings
DROP CONSTRAINT IF EXISTS exam_ratings_exam_id_fkey;

ALTER TABLE public.exam_ratings
ADD CONSTRAINT exam_ratings_exam_id_fkey
FOREIGN KEY (exam_id)
REFERENCES public.exams(id)
ON DELETE CASCADE;

COMMIT;