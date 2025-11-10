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

    const { assignment_id } = await req.json();
    
    if (!assignment_id) {
      throw new Error('Missing assignment_id');
    }

    console.log('Starting simulation for assignment:', assignment_id);

    // Fetch assignment data
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('id, case_id, time_limit')
      .eq('id', assignment_id)
      .single();

    if (assignError) throw assignError;
    if (!assignment) throw new Error('Assignment not found');
    if (!assignment.case_id) throw new Error('No case associated with assignment');

    // Fetch case data separately
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .select('id, clinical_json')
      .eq('id', assignment.case_id)
      .single();

    if (caseError) throw caseError;
    if (!caseRecord) throw new Error('Case data not found');
    
    const caseData = caseRecord.clinical_json as any;
    const runId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    // Create initial greeting from virtual patient
    const initialGreeting = `Namaste Doctor. ${caseData.stem || "I'm not feeling well."}`;

    // Create simulation run in database
    const { data: run, error: runError } = await supabase
      .from('simulation_runs')
      .insert({
        id: runId,
        assignment_id: assignment_id,
        student_id: user.id,
        start_at: startTime,
        transcript: [
          {
            role: 'patient',
            content: initialGreeting,
            timestamp: startTime
          }
        ],
        actions: [],
        status: 'in_progress'
      })
      .select()
      .single();

    if (runError) throw runError;

    console.log('Created simulation run:', runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        start_time: startTime,
        initial_message: initialGreeting,
        duration_minutes: caseData.durationMinutes,
        case_title: caseData.title,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in start_simulation:', error);
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
