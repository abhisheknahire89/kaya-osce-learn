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
    const { run_id, selectedOptionId, freeText, justification } = await req.json();
    
    if (!run_id) {
      throw new Error('Missing run_id');
    }

    if (!selectedOptionId && !freeText) {
      throw new Error('Must provide either selectedOptionId or freeText');
    }

    console.log('Submitting diagnosis for run:', run_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const diagnosisData = {
      selectedOptionId: selectedOptionId || null,
      freeText: freeText || null,
      justification: justification || null,
      timestamp: new Date().toISOString(),
      modelConfidence: null, // Will be filled by scoring if freeText
    };

    // First, get current actions
    const { data: currentRun, error: fetchError } = await supabase
      .from('simulation_runs')
      .select('actions')
      .eq('id', run_id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error('Failed to fetch simulation run');
    }

    const currentActions = currentRun.actions || [];
    const updatedActions = [
      ...currentActions,
      {
        type: 'diagnosis_submitted',
        payload: diagnosisData,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update simulation run with diagnosis
    const { error: updateError } = await supabase
      .from('simulation_runs')
      .update({
        actions: updatedActions,
      })
      .eq('id', run_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update simulation run');
    }

    console.log('Diagnosis submitted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        diagnosis: diagnosisData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in submit_diagnosis:', error);
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
