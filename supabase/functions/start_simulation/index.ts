import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignment_id, student_id, case_data } = await req.json();
    
    if (!assignment_id || !student_id || !case_data) {
      throw new Error('Missing required fields');
    }

    console.log('Starting simulation for student:', student_id);

    const runId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    // Create initial greeting from virtual patient
    const initialGreeting = `Namaste Doctor. ${case_data.stem}`;

    // Create simulation run in database (implement when Supabase is connected)
    // const { data: run, error } = await supabase
    //   .from('simulation_runs')
    //   .insert({
    //     id: runId,
    //     assignment_id,
    //     student_id,
    //     start_at: startTime,
    //     transcript: [
    //       {
    //         role: 'patient',
    //         content: initialGreeting,
    //         timestamp: startTime
    //       }
    //     ],
    //     actions: [],
    //     status: 'in_progress'
    //   })
    //   .select()
    //   .single();

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        start_time: startTime,
        initial_message: initialGreeting,
        duration_minutes: case_data.durationMinutes,
        case_title: case_data.title,
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
