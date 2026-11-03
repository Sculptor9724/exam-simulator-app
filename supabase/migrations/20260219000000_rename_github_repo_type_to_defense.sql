-- Align DB exam type values with UI type values exactly.
-- After this migration, no mapping layer is needed: DB value === UI type.

-- Rename legacy "Github Repo" → "defense"
UPDATE exams
SET type = 'defense'
WHERE type = 'Github Repo';

-- Rename legacy "Standard" → "generated-task"
UPDATE exams
SET type = 'generated-task'
WHERE type = 'Standard';
