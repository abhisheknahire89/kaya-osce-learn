import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { run_id, student_id } = await req.json();
    
    if (!run_id || !student_id) {
      throw new Error('Missing required fields: run_id or student_id');
    }

    console.log('Submitting simulation run:', run_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the simulation run
    const { data: runData, error: runError } = await supabase
      .from('simulation_runs')
      .select('*, assignments(case_id)')
      .eq('id', run_id)
      .single();

    if (runError || !runData) {
      throw new Error('Simulation run not found');
    }

    // Fetch the case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('clinical_json')
      .eq('id', runData.assignments.case_id)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found');
    }

    const clinicalCase = caseData.clinical_json;
    const transcript = runData.transcript || [];
    const actions = runData.actions || [];

    // Call the scoring function
    const { data: scoreResult, error: scoreError } = await supabase.functions.invoke('score_case', {
      body: {
        run_id,
        transcript,
        actions,
        caseData: clinicalCase,
      },
    });

    if (scoreError) {
      console.error('Scoring error:', scoreError);
      throw new Error('Failed to score simulation');
    }

    // Update the simulation run with score and end time
    const { error: updateError } = await supabase
      .from('simulation_runs')
      .update({
        end_at: new Date().toISOString(),
        score_json: scoreResult,
        status: 'completed',
      })
      .eq('id', run_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update simulation run');
    }

    console.log('Simulation submitted and scored successfully');

    // Build the debrief payload
    const debriefPayload = {
      runId: run_id,
      caseId: runData.assignments.case_id,
      studentId: student_id,
      score: scoreResult.totalPoints,
      maxScore: scoreResult.maxPoints,
      percent: scoreResult.percentage,
      grade: scoreResult.passed 
        ? (scoreResult.percentage >= 85 ? "Distinction" : "Pass")
        : (scoreResult.percentage >= 50 ? "Borderline" : "Fail"),
      timeTakenSec: runData.end_at 
        ? Math.floor((new Date(runData.end_at).getTime() - new Date(runData.start_at).getTime()) / 1000)
        : 0,
      rubric: scoreResult.sections || [],
      missedChecklist: scoreResult.missedItems || [],
      stepwiseReasoning: scoreResult.reasoning || [],
      learningPearls: scoreResult.pearls || [],
      mcqs: scoreResult.mcqs || [],
      audit: {
        modelMatches: scoreResult.llmMatches || [],
        rawModelOutputId: scoreResult.modelOutputId || null,
        events: actions,
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        debrief: debriefPayload,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in submit_run:', error);
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
