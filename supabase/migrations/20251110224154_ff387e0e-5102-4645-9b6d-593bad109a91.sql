-- Add deadline field to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deadline_at timestamp with time zone;

-- Update RLS policies to ensure students can see their assignments without cohort requirement
DROP POLICY IF EXISTS "Students can view their cohort assignments" ON assignments;

CREATE POLICY "Students can view all assignments"
ON assignments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));