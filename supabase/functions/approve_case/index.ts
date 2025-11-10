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

    const { case_id, clinical_json, faculty_id } = await req.json();
    console.log('Approving case:', case_id, 'by faculty:', user.id);

    // If clinical_json provided, this is a new case to insert
    if (clinical_json) {
      // Insert new case
      const { data: newCase, error: insertError } = await supabase
        .from('cases')
        .insert({
          slug: clinical_json.slug,
          title: clinical_json.title,
          subject: clinical_json.subject,
          difficulty: 'Medium', // Default or compute from params
          clinical_json: clinical_json,
          created_by: user.id,
          status: 'approved',
          cbdc_tags: {
            competencyIds: clinical_json.competencyIds,
            sloIds: clinical_json.sloIds,
            millerLevel: clinical_json.millerLevel,
            bloomDomain: clinical_json.bloomDomain,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create initial version
      const { error: versionError } = await supabase
        .from('case_versions')
        .insert({
          case_id: newCase.id,
          version: 1,
          clinical_json: clinical_json,
          change_log: 'Initial approval',
        });

      if (versionError) {
        console.error('Version creation error:', versionError);
      }

      // Log event
      console.log('Event: case_approved', {
        actor: user.id,
        case_id: newCase.id,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          case_id: newCase.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Otherwise, update existing case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', case_id)
      .eq('created_by', user.id)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found or unauthorized');
    }

    // Update case status to approved
    const { error: updateError } = await supabase
      .from('cases')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', case_id);

    if (updateError) throw updateError;

    // Create case version entry
    const { error: versionError } = await supabase
      .from('case_versions')
      .insert({
        case_id: case_id,
        version: 1,
        clinical_json: caseData.clinical_json,
        change_log: 'Initial approval',
      });

    if (versionError) {
      console.error('Version creation error:', versionError);
      // Non-blocking - continue even if version fails
    }

    // Log event
    console.log('Event: case_approved', {
      actor: user.id,
      case_id: case_id,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        case_id: case_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in approve_case:', error);
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
