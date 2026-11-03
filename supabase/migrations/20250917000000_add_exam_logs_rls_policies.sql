-- Policy: Teachers can view exam logs for exams they created
CREATE POLICY "Teachers can view exam logs for their exams"
ON exam_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_logs.exam_id 
    AND exams.user_id = auth.uid()
  )
);

-- Policy: Teachers cannot modify student exam logs (they can only view them)
-- This is intentional - teachers should not be able to change student results
