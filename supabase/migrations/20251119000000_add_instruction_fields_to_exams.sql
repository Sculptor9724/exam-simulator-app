-- Add instruction fields to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS task_generation_instructions TEXT,
ADD COLUMN IF NOT EXISTS examiner_instructions TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN exams.task_generation_instructions IS 'Extra instructions for the LLM when generating tasks (e.g., "avoid async/await", "make it funny"). Only used when type is "generated-task"';
COMMENT ON COLUMN exams.examiner_instructions IS 'Extra instructions for the AI examiner behavior during voice examination';
