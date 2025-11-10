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
      throw new Error('Unauthorized: Admin role required');
    }

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv';
    const period = url.searchParams.get('period') || 'weekly';
    const date = url.searchParams.get('date') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cohortId = url.searchParams.get('cohortId');

    console.log('Export request:', { format, period, date, cohortId, adminId: user.id });

    // Fetch snapshot data (same logic as admin_leaderboard GET)
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

    const { data: snapshot, error: snapshotError } = await query.maybeSingle();

    if (snapshotError) throw snapshotError;

    if (!snapshot) {
      throw new Error('No snapshot found for this date/period');
    }

    const metrics = snapshot.metrics as any[];

    // Sort by avgScore desc
    metrics.sort((a, b) => b.avgScore - a.avgScore);

    // Fetch cohort names for display
    const cohortIds = [...new Set(metrics.map(m => m.cohortId).filter(Boolean))];
    const { data: cohorts } = await supabase
      .from('cohorts')
      .select('id, name')
      .in('id', cohortIds);

    const cohortMap: Record<string, string> = {};
    cohorts?.forEach(c => {
      cohortMap[c.id] = c.name;
    });

    // Log export event
    await supabase
      .from('admin_exports')
      .insert({
        admin_id: user.id,
        params_json: {
          period,
          date,
          cohortId,
          format,
        },
        format: format,
        file_url: null,
      });

    if (format === 'json') {
      return new Response(
        JSON.stringify({
          exportDate: new Date().toISOString(),
          snapshotDate: date,
          period: period,
          cohortId: cohortId || null,
          totalStudents: metrics.length,
          metrics: metrics.map(m => ({
            ...m,
            cohortName: cohortMap[m.cohortId] || 'Unknown',
          })),
        }, null, 2),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="leaderboard_${period}_${date}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvHeader = 'studentId,name,cohortName,avgScore,attempts,lastAttemptAt\n';
    const csvRows = metrics.map(m => {
      const cohortName = cohortMap[m.cohortId] || 'Unknown';
      return `${m.studentId},"${m.name}","${cohortName}",${m.avgScore},${m.attempts},${m.lastAttemptAt}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leaderboard_${period}_${date}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error in admin_leaderboard_export:', error);
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
