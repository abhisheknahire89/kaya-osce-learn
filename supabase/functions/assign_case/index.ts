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

    // Verify faculty role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'faculty') {
      throw new Error('Unauthorized: Faculty role required');
    }

    const { case_id, cohort_id, start_at, end_at, time_limit } = await req.json();
    console.log('Assigning case:', case_id, 'to cohort:', cohort_id);

    // Verify case is approved
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('status')
      .eq('id', case_id)
      .single();

    if (caseError || caseData?.status !== 'approved') {
      throw new Error('Case must be approved before assignment');
    }

    // Create assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        case_id: case_id,
        cohort_id: cohort_id,
        start_at: start_at,
        end_at: end_at,
        time_limit: time_limit || 12,
        attempts_allowed: 1,
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Log event
    console.log('Event: case_assigned', {
      actor: user.id,
      case_id: case_id,
      cohort_id: cohort_id,
      assignment_id: assignmentData.id,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send notification to cohort students

    return new Response(
      JSON.stringify({
        success: true,
        assignment_id: assignmentData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in assign_case:', error);
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
