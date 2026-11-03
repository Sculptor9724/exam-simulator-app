-- Reconcile the migration chain with the checked-in schema and current frontend.
-- No production data is removed automatically: constraints fail on invalid legacy
-- rows so the operator must inspect them before migrating an existing deployment.
BEGIN;

-- The frontend inserts only class_id/profile_id. The old NOT NULL user_id column
-- was removed manually in the schema snapshot but that step was not versioned.
ALTER TABLE public.class_memberships DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.class_memberships ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.class_memberships ADD CONSTRAINT class_memberships_class_profile_key
  UNIQUE (class_id, profile_id);

-- Private exams assigned to a user's class must be readable by that member.
CREATE POLICY "Members can read assigned exams" ON public.exams
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.class_exams ce
    JOIN public.class_memberships cm ON cm.class_id = ce.class_id
    WHERE ce.exam_id = exams.id AND public.user_has_profile(cm.profile_id)
  )
);
CREATE POLICY "Exam owners can read ratings" ON public.exam_ratings
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.exams e
          WHERE e.id = exam_ratings.exam_id AND e.user_id = auth.uid())
);

-- Do not carry a specific person's administrative access into new installations.
DROP POLICY IF EXISTS "Only behu@ek.dk can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only behu@ek.dk can delete waitlist" ON public.waitlist;
-- Waitlist administration is server/service-role only; public signup stays insert-only.

-- The historical joining policy exposed classes to anonymous callers.
ALTER POLICY "Students can view class info for joining" ON public.classes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_memberships, public.class_exams
  TO authenticated;
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
COMMIT;
