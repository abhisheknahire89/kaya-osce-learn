-- Enable realtime for simulation_runs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_runs;

-- Enable realtime for leaderboard_snapshots table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_snapshots;