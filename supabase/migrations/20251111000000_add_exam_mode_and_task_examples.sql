-- Add examples column to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS examples TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN exams.examples IS 'Concatenated task examples separated by newline-dash-dash-dash-newline for few-shot prompting (only used when type is "generated-task")';
