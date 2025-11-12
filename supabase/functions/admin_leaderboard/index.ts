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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      console.warn('Unauthorized access attempt by', user.id);
      throw new Error('Unauthorized: Admin role required');
    }

    // Handle POST for refresh or fetch
    if (req.method === 'POST') {
      const body = await req.json();
      const { period, snapshot_date, cohort_id, refresh, page, pageSize, sort, order, subject } = body;
      
      // If refresh is explicitly requested, trigger snapshot regeneration
      if (refresh === true) {
        const { data: jobData, error: jobError } = await supabase.functions.invoke('generate_leaderboard_snapshot', {
          body: { period, snapshot_date, cohort_id },
        });

        if (jobError) throw jobError;

        return new Response(
          JSON.stringify({
            success: true,
            jobId: 'refresh-' + Date.now(),
            status: 'completed',
            data: jobData,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Otherwise, treat POST as a fetch request with body params
      // Extract params from body for POST requests
      const fetchPeriod = period || 'weekly';
      const fetchDate = snapshot_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fetchPage = page !== undefined ? page : 0;
      const fetchPageSize = pageSize || 25;
      const fetchSort = sort || 'avgScore';
      const fetchOrder = order || 'desc';
      const fetchCohortId = cohort_id;
      const fetchSubject = subject;

      console.log('POST Leaderboard request:', { period: fetchPeriod, date: fetchDate, cohortId: fetchCohortId, subject: fetchSubject, page: fetchPage, pageSize: fetchPageSize, sort: fetchSort, order: fetchOrder });

      // Continue with fetch logic using these params
      return await handleFetch(supabase, fetchPeriod, fetchDate, fetchCohortId, fetchSubject, fetchPage, fetchPageSize, fetchSort, fetchOrder, corsHeaders);
    }

    // Handle GET for leaderboard data
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'weekly';
    const date = url.searchParams.get('date') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cohortId = url.searchParams.get('cohortId');
    const subject = url.searchParams.get('subject');
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');
    const sort = url.searchParams.get('sort') || 'avgScore';
    const order = url.searchParams.get('order') || 'desc';

    console.log('GET Leaderboard request:', { period, date, cohortId, subject, page, pageSize, sort, order });

    return await handleFetch(supabase, period, date, cohortId, subject, page, pageSize, sort, order, corsHeaders);

  } catch (error) {
    console.error('Error in admin_leaderboard:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Extract fetch logic into a separate function to avoid duplication
async function handleFetch(
  supabase: any,
  period: string,
  date: string,
  cohortId: string | null,
  subject: string | null,
  page: number,
  pageSize: number,
  sort: string,
  order: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {

    // If subject filter is present, compute on-the-fly
    if (subject) {
      // Calculate date range
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (period === 'all') {
        // No date filtering for all-time
        startDate = null;
        endDate = null;
      } else if (period === 'daily') {
        startDate = date;
        endDate = date;
      } else {
        const dateObj = new Date(date);
        const sixDaysAgo = new Date(dateObj.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = sixDaysAgo.toISOString().split('T')[0];
        endDate = date;
      }

      // Fetch simulation runs and assignments separately
      let runsQuery = supabase
        .from('simulation_runs')
        .select('student_id, score_json, end_at, assignment_id')
        .eq('status', 'completed');

      // Only add date filters if not all-time
      if (startDate && endDate) {
        runsQuery = runsQuery
          .gte('end_at', `${startDate}T00:00:00`)
          .lte('end_at', `${endDate}T23:59:59`);
      }

      const { data: runs, error: runsError } = await runsQuery;

      if (runsError) throw runsError;

      // Fetch profiles separately
      const studentIds = [...new Set(runs?.map((r: any) => r.student_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, metadata')
        .in('id', studentIds);

      // Fetch assignments and cases
      const assignmentIds = [...new Set(runs?.map((r: any) => r.assignment_id).filter(Boolean) || [])];
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, case_id')
        .in('id', assignmentIds);

      const caseIds = [...new Set(assignments?.map((a: any) => a.case_id).filter(Boolean) || [])];
      const { data: cases } = await supabase
        .from('cases')
        .select('id, subject')
        .in('id', caseIds);

      // Create maps
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      const assignmentMap = new Map(assignments?.map((a: any) => [a.id, a]) || []);
      const caseMap = new Map(cases?.map((c: any) => [c.id, c]) || []);

      // Filter by subject and compute metrics
      const filteredRuns = runs?.filter((run: any) => {
        const assignment: any = assignmentMap.get(run.assignment_id);
        if (!assignment) return false;
        const caseData: any = caseMap.get(assignment.case_id);
        return caseData?.subject === subject;
      }) || [];

      const studentMetrics: Record<string, any> = {};

      filteredRuns.forEach((run: any) => {
        const studentId = run.student_id;
        const scoreData = run.score_json as any;
        const percent = scoreData?.percentage || 0;
        const normalizedScore = percent / 10; // Convert to 0-10 scale
        const profile: any = profileMap.get(studentId);
        const profileMetadata = profile?.metadata as any;
        const studentCohortId = profileMetadata?.cohort_id;

        if (cohortId && studentCohortId !== cohortId) {
          return;
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

        studentMetrics[studentId].scores.push(normalizedScore);
        studentMetrics[studentId].attempts += 1;
        
        if (new Date(run.end_at) > new Date(studentMetrics[studentId].lastAttemptAt)) {
          studentMetrics[studentId].lastAttemptAt = run.end_at;
        }
      });

      let metrics = Object.values(studentMetrics).map(student => ({
        studentId: student.studentId,
        name: student.name,
        cohortId: student.cohortId,
        avgScore: student.scores.length > 0 
          ? Math.round((student.scores.reduce((a: number, b: number) => a + b, 0) / student.scores.length) * 100) / 100
          : 0,
        attempts: student.attempts,
        lastAttemptAt: student.lastAttemptAt,
      }));

      // Sort metrics
      metrics.sort((a, b) => {
        const aVal = a[sort as keyof typeof a] as number;
        const bVal = b[sort as keyof typeof b] as number;
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Paginate
      const totalStudents = metrics.length;
      const paginatedMetrics = metrics.slice(page * pageSize, (page + 1) * pageSize);

      return new Response(
        JSON.stringify({
          snapshotDate: date,
          period: period,
          cohortId: cohortId || null,
          subject: subject,
          totalStudents: totalStudents,
          page: page,
          pageSize: pageSize,
          metrics: paginatedMetrics,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For "all" period, compute on-the-fly (no snapshots)
    if (period === 'all') {
      // Fetch all completed runs
      const { data: runs, error: runsError } = await supabase
        .from('simulation_runs')
        .select('student_id, score_json, end_at')
        .eq('status', 'completed');

      if (runsError) throw runsError;

      // Fetch profiles
      const studentIds = [...new Set(runs?.map((r: any) => r.student_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      // Compute metrics per student
      const studentMetrics = new Map<string, { scores: number[]; lastAttemptAt: string }>();

      runs?.forEach((run: any) => {
        if (!run.score_json?.totalPoints || !run.score_json?.maxPoints) return;
        
        const normalizedScore = (run.score_json.totalPoints / run.score_json.maxPoints) * 10;
        
        if (!studentMetrics.has(run.student_id)) {
          studentMetrics.set(run.student_id, { scores: [], lastAttemptAt: run.end_at });
        }
        
        const metrics = studentMetrics.get(run.student_id)!;
        metrics.scores.push(normalizedScore);
        if (new Date(run.end_at) > new Date(metrics.lastAttemptAt)) {
          metrics.lastAttemptAt = run.end_at;
        }
      });

      // Build final metrics array
      const metrics = Array.from(studentMetrics.entries()).map(([studentId, data]) => {
        const profile: any = profileMap.get(studentId);
        return {
          studentId,
          name: profile?.name || 'Unknown',
          avgScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
          attempts: data.scores.length,
          lastAttemptAt: data.lastAttemptAt,
        };
      });

      // Sort
      metrics.sort((a, b) => {
        const aVal = sort === 'avgScore' ? a.avgScore : a.attempts;
        const bVal = sort === 'avgScore' ? b.avgScore : b.attempts;
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Paginate
      const totalStudents = metrics.length;
      const paginatedMetrics = metrics.slice(page * pageSize, (page + 1) * pageSize);

      return new Response(
        JSON.stringify({
          snapshotDate: date,
          period: 'all',
          cohortId: null,
          totalStudents: totalStudents,
          page: page,
          pageSize: pageSize,
          metrics: paginatedMetrics,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch from snapshot
    let query = supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('snapshot_date', date)
      .eq('period', period);

    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    } else {
      query = query.is('cohort_id', null);
    }

    // There may be multiple snapshots (e.g., from earlier bugs). Take the latest one.
    const { data: snapshots, error: snapshotError } = await query
      .order('created_at', { ascending: false })
      .limit(1);

    if (snapshotError) {
      console.error('Error fetching snapshot:', snapshotError);
      throw snapshotError;
    }

    const snapshot = Array.isArray(snapshots) ? snapshots[0] : null;

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          snapshotDate: date,
          period: period,
          cohortId: cohortId || null,
          totalStudents: 0,
          page: page,
          pageSize: pageSize,
          metrics: [],
          message: 'No snapshot found for this date/period. Run refresh to generate.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let metrics = snapshot.metrics as any[];

    // Sort metrics
    metrics.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Paginate
    const totalStudents = metrics.length;
    const paginatedMetrics = metrics.slice(page * pageSize, (page + 1) * pageSize);

    return new Response(
      JSON.stringify({
        snapshotDate: snapshot.snapshot_date,
        period: snapshot.period,
        cohortId: snapshot.cohort_id,
        totalStudents: totalStudents,
        page: page,
        pageSize: pageSize,
        metrics: paginatedMetrics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in handleFetch:', error);
    throw error;
  }
}
