import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { period, snapshot_date, cohort_id } = await req.json();
    console.log('Generating leaderboard snapshot:', { period, snapshot_date, cohort_id });

    const snapshotDate = snapshot_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate date range based on period
    let startDate: string;
    let endDate: string;

    if (period === 'daily') {
      startDate = snapshotDate;
      endDate = snapshotDate;
    } else { // weekly
      const dateObj = new Date(snapshotDate);
      const sixDaysAgo = new Date(dateObj.getTime() - 6 * 24 * 60 * 60 * 1000);
      startDate = sixDaysAgo.toISOString().split('T')[0];
      endDate = snapshotDate;
    }

    console.log('Date range:', { startDate, endDate });

    // Fetch cohorts to generate snapshots for
    const { data: cohorts, error: cohortError } = await supabase
      .from('cohorts')
      .select('id, name');

    if (cohortError) {
      console.error('Error fetching cohorts:', cohortError);
      throw cohortError;
    }

    const cohortsToProcess = cohort_id 
      ? cohorts?.filter(c => c.id === cohort_id) || []
      : [...(cohorts || []), { id: null, name: 'Global' }];

    const generatedSnapshots = [];

    for (const cohort of cohortsToProcess) {
      console.log(`Processing cohort: ${cohort.name} (${cohort.id})`);

      // Build query for simulation runs
      // Fetch simulation runs without join
      const { data: runs, error: runsError } = await supabase
        .from('simulation_runs')
        .select('student_id, score_json, end_at')
        .eq('status', 'completed')
        .gte('end_at', `${startDate}T00:00:00`)
        .lte('end_at', `${endDate}T23:59:59`)
        .not('score_json', 'is', null);

      if (runsError) {
        console.error('Error fetching runs:', runsError);
        throw runsError;
      }

      // Fetch profiles separately
      const studentIds = [...new Set(runs?.map(r => r.student_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, metadata')
        .in('id', studentIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create profile map
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      console.log(`Found ${runs?.length || 0} runs for cohort ${cohort.name}`);

      // Group by student and compute metrics
      const studentMetrics: Record<string, any> = {};

      runs?.forEach(run => {
        const studentId = run.student_id;
        const scoreData = run.score_json as any;
        const percent = scoreData?.percent || 0;
        
        // Get profile from map
        const profile = profileMap.get(studentId);
        const profileMetadata = profile?.metadata as any;
        const studentCohortId = profileMetadata?.cohort_id;
        
        if (cohort.id && studentCohortId !== cohort.id) {
          return; // Skip this run if it doesn't match the cohort
        }

        if (!studentMetrics[studentId]) {
          studentMetrics[studentId] = {
            studentId: studentId,
            name: profile?.name || 'Unknown',
            cohortId: studentCohortId,
            scores: [],
            attempts: 0,
            lastAttemptAt: run.end_at,
          };
        }

        studentMetrics[studentId].scores.push(percent);
        studentMetrics[studentId].attempts += 1;
        
        if (new Date(run.end_at) > new Date(studentMetrics[studentId].lastAttemptAt)) {
          studentMetrics[studentId].lastAttemptAt = run.end_at;
        }
      });

      // Calculate averages and format metrics
      const metrics = Object.values(studentMetrics).map(student => ({
        studentId: student.studentId,
        name: student.name,
        cohortId: student.cohortId,
        avgScore: student.scores.length > 0 
          ? Math.round((student.scores.reduce((a: number, b: number) => a + b, 0) / student.scores.length) * 100) / 100
          : 0,
        attempts: student.attempts,
        lastAttemptAt: student.lastAttemptAt,
      }));

      console.log(`Computed metrics for ${metrics.length} students in cohort ${cohort.name}`);

      // Delete existing snapshot for this date/period/cohort
      const { error: deleteError } = await supabase
        .from('leaderboard_snapshots')
        .delete()
        .eq('snapshot_date', snapshotDate)
        .eq('period', period)
        .eq('cohort_id', cohort.id || 'null');

      if (deleteError) {
        console.error('Error deleting old snapshot:', deleteError);
      }

      // Insert new snapshot
      const { data: snapshot, error: insertError } = await supabase
        .from('leaderboard_snapshots')
        .insert({
          snapshot_date: snapshotDate,
          period: period,
          cohort_id: cohort.id,
          metrics: metrics,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting snapshot:', insertError);
        throw insertError;
      }

      generatedSnapshots.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        studentCount: metrics.length,
        snapshotId: snapshot.id,
      });
    }

    // Cleanup old snapshots (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().split('T')[0];

    const { error: cleanupError } = await supabase
      .from('leaderboard_snapshots')
      .delete()
      .lt('snapshot_date', cutoffDate);

    if (cleanupError) {
      console.error('Error cleaning up old snapshots:', cleanupError);
    } else {
      console.log('Cleaned up snapshots older than', cutoffDate);
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapshotDate: snapshotDate,
        period: period,
        snapshots: generatedSnapshots,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate_leaderboard_snapshot:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
