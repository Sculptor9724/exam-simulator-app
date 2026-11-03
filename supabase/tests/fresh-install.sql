-- Run as postgres ONLY against a disposable/local database after all migrations.
-- Synthetic users/data only; all test writes roll back.
BEGIN;
INSERT INTO public.signup_allowed_emails(email) VALUES
 ('test1@example.invalid'),('test2@example.invalid'),('test3@example.invalid');
DO $$ BEGIN
 BEGIN
  INSERT INTO auth.users(id,email) VALUES('00000000-0000-0000-0000-000000000099','blocked@example.invalid');
  RAISE EXCEPTION 'Signup allowed without allowlist';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-000000000001', 'test1@example.invalid', '{"full_name":"Test Teacher","is_student":false}'),
 ('00000000-0000-0000-0000-000000000002', 'test2@example.invalid', '{"full_name":"Test Student","is_student":true}'),
 ('00000000-0000-0000-0000-000000000003', 'test3@example.invalid', '{"full_name":"Test Outsider","is_student":true}');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE user_id::text LIKE '00000000-0000-0000-0000-00000000000%') <> 3
 THEN RAISE EXCEPTION 'Signup profile trigger failed'; END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='class_memberships' AND column_name='user_id')
 THEN RAISE EXCEPTION 'Legacy membership column remains'; END IF;
 IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename IN ('profiles','classes','exams','exam_logs','exam_ratings','class_memberships','class_exams','user_data','waitlist','budget_status','signup_allowed_emails') AND NOT rowsecurity)
 THEN RAISE EXCEPTION 'RLS missing'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
INSERT INTO public.classes(id,user_id,title,join_code) VALUES ('10000000-0000-0000-0000-000000000001',auth.uid(),'Synthetic class','TEST0001');
INSERT INTO public.exams(id,user_id,title,is_public,examples,task_generation_instructions,examiner_instructions)
 OVERRIDING SYSTEM VALUE VALUES (-90001,auth.uid(),'Synthetic private exam',false,'Example','Task guidance','Exam guidance');
INSERT INTO public.class_exams(class_id,exam_id) VALUES ('10000000-0000-0000-0000-000000000001',-90001);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.exams WHERE id=-90001) THEN RAISE EXCEPTION 'Private exam visible before joining'; END IF;
END $$;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.classes WHERE join_code='TEST0001') THEN RAISE EXCEPTION 'Join-code lookup failed'; END IF;
 IF EXISTS (SELECT 1 FROM public.classes WHERE join_code='WRONGCODE') THEN RAISE EXCEPTION 'Wrong code matched'; END IF;
END $$;
INSERT INTO public.class_memberships(class_id,profile_id)
 SELECT c.id,p.id FROM public.classes c CROSS JOIN public.profiles p
 WHERE c.join_code='TEST0001' AND p.user_id=auth.uid();
DO $$ BEGIN
 BEGIN
  INSERT INTO public.class_memberships(class_id,profile_id)
   SELECT '10000000-0000-0000-0000-000000000001',id FROM public.profiles WHERE user_id=auth.uid();
  RAISE EXCEPTION 'Duplicate membership accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.exams WHERE id=-90001) THEN RAISE EXCEPTION 'Assigned exam not visible'; END IF;
 IF (SELECT count(*) FROM public.class_memberships WHERE class_id='10000000-0000-0000-0000-000000000001') <> 1 THEN RAISE EXCEPTION 'Expected one membership'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id='10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'Joined class not visible'; END IF;
END $$;
INSERT INTO public.exam_logs(user_id,exam_id,grade,feedback,finished_at) VALUES (auth.uid(),-90001,'7','Synthetic feedback',now());
INSERT INTO public.exam_ratings(user_id,exam_id,rating,good_feedback) VALUES(auth.uid(),-90001,4,'Synthetic feedback');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
INSERT INTO public.classes(id,user_id,title)
 VALUES('10000000-0000-0000-0000-000000000003',auth.uid(),'Outsider class');
DO $$ BEGIN
 BEGIN
  INSERT INTO public.class_exams(class_id,exam_id) VALUES('10000000-0000-0000-0000-000000000003',-90001);
  RAISE EXCEPTION 'Foreign exam attached to own class';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.exams(user_id,title) VALUES('00000000-0000-0000-0000-000000000001','Spoof');
  RAISE EXCEPTION 'Spoofed exam owner accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.exam_logs WHERE exam_id=-90001) THEN RAISE EXCEPTION 'Other student logs exposed'; END IF;
 IF EXISTS (SELECT 1 FROM public.exams WHERE id=-90001) THEN RAISE EXCEPTION 'Private exam exposed to non-member'; END IF;
 IF EXISTS (SELECT 1 FROM public.class_memberships WHERE class_id='10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'Other memberships exposed'; END IF;
 BEGIN
  INSERT INTO public.exam_logs(user_id,exam_id) VALUES('00000000-0000-0000-0000-000000000002',-90001);
  RAISE EXCEPTION 'Spoofed log owner accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.exam_logs WHERE exam_id=-90001) THEN RAISE EXCEPTION 'Teacher cannot read results'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.exam_ratings WHERE exam_id=-90001) THEN RAISE EXCEPTION 'Teacher cannot read ratings'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id='00000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'Teacher cannot read student profile'; END IF;
 UPDATE public.exam_logs SET feedback='should not update' WHERE exam_id=-90001;
 IF FOUND THEN RAISE EXCEPTION 'Teacher changed student feedback'; END IF;
END $$;
RESET ROLE;
INSERT INTO public.signup_allowed_emails(email) VALUES('allowed@example.invalid');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 BEGIN
  INSERT INTO public.class_memberships(class_id,profile_id)
   VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001');
  RAISE EXCEPTION 'Anonymous join allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

DO $$ BEGIN
 IF NOT public.is_signup_email_allowed(' ALLOWED@example.invalid ') THEN RAISE EXCEPTION 'Allowlist normalization failed'; END IF;
 IF public.is_signup_email_allowed('not-allowed@example.invalid') THEN RAISE EXCEPTION 'Allowlist accepted unknown email'; END IF;
END $$;
INSERT INTO public.waitlist(email) VALUES ('waitlist@example.invalid');
RESET ROLE;
DELETE FROM auth.users WHERE id='00000000-0000-0000-0000-000000000002';
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.exam_logs WHERE exam_id=-90001) OR EXISTS (SELECT 1 FROM public.exam_ratings WHERE exam_id=-90001)
 THEN RAISE EXCEPTION 'Account deletion did not cascade'; END IF;
 IF EXISTS (SELECT 1 FROM public.class_memberships WHERE class_id='10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'Membership deletion did not cascade'; END IF;
END $$;
ROLLBACK;
-- Export reconciliation regressions, using only synthetic data in a transaction.
BEGIN;
INSERT INTO public.signup_allowed_emails(email) VALUES('test4@example.invalid');
INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('00000000-0000-0000-0000-000000000004','test4@example.invalid','{"full_name":"Schema Test"}');
INSERT INTO public.user_data(id,updated_at)
 VALUES('00000000-0000-0000-0000-000000000004','2000-01-01');
UPDATE public.user_data SET full_name='Synthetic update'
 WHERE id='00000000-0000-0000-0000-000000000004';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_data WHERE id='00000000-0000-0000-0000-000000000004' AND updated_at=now())
 THEN RAISE EXCEPTION 'Legacy timestamp trigger missing'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
-- No OVERRIDING SYSTEM VALUE: verifies exported BY DEFAULT identity semantics.
INSERT INTO public.exams(id,user_id,title) VALUES(-90002,auth.uid(),'Synthetic import');
INSERT INTO public.exam_logs(user_id,exam_id) VALUES(auth.uid(),-90002);
INSERT INTO public.exam_ratings(user_id,exam_id,rating) VALUES(auth.uid(),-90002,3);
DO $$ BEGIN
 BEGIN
  DELETE FROM public.exam_logs WHERE exam_id=-90002;
  RAISE EXCEPTION 'Client log deletion permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.exam_ratings SET rating=5 WHERE exam_id=-90002;
  RAISE EXCEPTION 'Client rating edit permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  TRUNCATE public.exam_logs;
  RAISE EXCEPTION 'Authenticated truncate permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.waitlist(email) VALUES('export-test@example.invalid');
DO $$ BEGIN
 BEGIN
  INSERT INTO public.waitlist(email,sent_invite) VALUES('spoof@example.invalid',true);
  RAISE EXCEPTION 'Client invitation flag write permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM email FROM public.waitlist;
  RAISE EXCEPTION 'Anonymous waitlist read permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE service_role;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.waitlist WHERE email='export-test@example.invalid' AND sent_invite=false)
 THEN RAISE EXCEPTION 'Invitation default or service access incorrect'; END IF;
END $$;
UPDATE public.waitlist SET sent_invite=true WHERE email='export-test@example.invalid';
UPDATE public.budget_status SET budget_amount=100 WHERE id=1;
INSERT INTO public.signup_allowed_emails(email) VALUES('service-test@example.invalid');
RESET ROLE;
ROLLBACK;
