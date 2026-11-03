-- Security fixes for the reviewed fresh-install release; never applied to production here.
BEGIN;
CREATE OR REPLACE FUNCTION public.owns_exam(target_exam bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.exams e WHERE e.id=target_exam AND e.user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.owns_exam(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_exam(bigint) TO authenticated;
DROP POLICY "Teachers can manage class exams for their own classes" ON public.class_exams;
CREATE POLICY "Teachers can manage class exams for their own classes" ON public.class_exams
 FOR ALL TO authenticated
 USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id=class_id AND c.user_id=auth.uid()))
 WITH CHECK (
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id=class_id AND c.user_id=auth.uid())
  AND public.owns_exam(exam_id)
 );
-- Enforce the existing email allowlist at Auth insertion, not only in browser code.
CREATE OR REPLACE FUNCTION public.enforce_signup_allowlist() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.signup_allowed_emails a
                WHERE lower(trim(a.email))=lower(trim(NEW.email))) THEN
  RAISE EXCEPTION 'Signup is not enabled for this email' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_signup_allowlist() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_signup_allowlist BEFORE INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_allowlist();
COMMIT;
