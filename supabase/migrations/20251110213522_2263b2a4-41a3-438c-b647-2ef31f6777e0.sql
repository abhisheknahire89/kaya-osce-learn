-- Drop the old policy that allows all approved cases
DROP POLICY IF EXISTS "Students can view approved cases" ON cases;

-- Create new policy that checks if case is assigned to student's cohort
CREATE POLICY "Students can view assigned cases"
ON cases
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  AND has_role(auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 
    FROM assignments a
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE a.case_id = cases.id
    AND a.cohort_id::text = (p.metadata->>'cohort_id')
    AND NOW() BETWEEN a.start_at AND a.end_at
  )
);

-- Update assignments policy to be more specific for students
DROP POLICY IF EXISTS "Students can view assignments" ON assignments;

CREATE POLICY "Students can view their cohort assignments"
ON assignments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = auth.uid()
    AND cohort_id::text = (p.metadata->>'cohort_id')
  )
);