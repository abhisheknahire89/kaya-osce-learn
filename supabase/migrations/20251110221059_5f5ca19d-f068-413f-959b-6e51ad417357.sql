-- Drop existing restrictive student policy on cases
DROP POLICY IF EXISTS "Students can view assigned cases" ON public.cases;

-- Create new policy allowing students to view all approved cases
CREATE POLICY "Students can view all approved cases"
ON public.cases
FOR SELECT
TO authenticated
USING (
  status = 'approved'::case_status 
  AND has_role(auth.uid(), 'student'::app_role)
);

-- Update simulation_runs policy to allow students to create runs for any approved case
DROP POLICY IF EXISTS "Students can manage own runs" ON public.simulation_runs;

CREATE POLICY "Students can manage own runs"
ON public.simulation_runs
FOR ALL
TO authenticated
USING (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role))
WITH CHECK (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));