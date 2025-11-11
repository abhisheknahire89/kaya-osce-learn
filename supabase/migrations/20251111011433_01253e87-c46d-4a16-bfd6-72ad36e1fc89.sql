-- Drop the insecure policy that allows unrestricted access
DROP POLICY IF EXISTS "System can manage leaderboard snapshots" ON public.leaderboard_snapshots;

-- Add admin-only policies for write operations
CREATE POLICY "Admins can insert leaderboard snapshots"
ON public.leaderboard_snapshots
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leaderboard snapshots"
ON public.leaderboard_snapshots
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leaderboard snapshots"
ON public.leaderboard_snapshots
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));