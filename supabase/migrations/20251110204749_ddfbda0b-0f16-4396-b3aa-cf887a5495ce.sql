-- Create leaderboard_snapshots table for pre-computed metrics
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly')),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_exports table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  params_json JSONB NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_runs_end_at ON public.simulation_runs(end_at);
CREATE INDEX IF NOT EXISTS idx_runs_status_end_at ON public.simulation_runs(status, end_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snaps_date_period ON public.leaderboard_snapshots(snapshot_date, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snaps_cohort ON public.leaderboard_snapshots(cohort_id);
CREATE INDEX IF NOT EXISTS idx_admin_exports_admin_id ON public.admin_exports(admin_id);

-- Enable RLS on new tables
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard_snapshots
CREATE POLICY "Admins can view leaderboard snapshots"
  ON public.leaderboard_snapshots
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage leaderboard snapshots"
  ON public.leaderboard_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for admin_exports
CREATE POLICY "Admins can view own exports"
  ON public.admin_exports
  FOR SELECT
  USING (auth.uid() = admin_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create exports"
  ON public.admin_exports
  FOR INSERT
  WITH CHECK (auth.uid() = admin_id AND has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.leaderboard_snapshots IS 'Pre-computed leaderboard metrics aggregated daily and weekly';
COMMENT ON TABLE public.admin_exports IS 'Audit trail for admin data exports';
