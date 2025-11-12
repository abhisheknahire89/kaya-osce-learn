-- Allow admins to view all simulation runs
CREATE POLICY "Admins can view all runs" 
ON simulation_runs 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));