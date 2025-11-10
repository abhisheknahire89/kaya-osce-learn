import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { run_id, message, conversationHistory, caseData } = await req.json();
    
    if (!run_id || !message || !caseData) {
      throw new Error('Missing required fields: run_id, message, or caseData');
    }

    console.log('Processing message for run:', run_id);

    // Build system message with case context
    const systemMessage = `SYSTEM: You are "Kaya Virtual Patient" playing the role of the patient in the following ClinicalCase. Speak as the patient in short sentences. Be empathetic, slightly formal, and include Ayurvedic terms only if asked. If asked clinical questions, answer truthfully based on the case script. Always keep responses <140 characters for mobile readability. If asked open counseling questions, respond with emotional statements.

CASE CONTEXT:
Patient Name: ${caseData.patient.name}
Age: ${caseData.patient.age}
Gender: ${caseData.patient.gender}
Chief Complaint: ${caseData.stem}

HISTORY RESPONSES:
${Object.entries(caseData.script.history).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}

EXAMINATION FINDINGS (reveal only when requested):
${Object.entries(caseData.script.onRequestExam || {}).map(([exam, finding]) => `${exam}: ${finding}`).join('\n')}

LAB RESULTS (reveal only when ordered):
${Object.entries(caseData.script.labsOnOrder || {}).map(([lab, result]) => `${lab}: ${result}`).join('\n')}

Remember: Stay in character as the patient. Keep responses brief and natural.`;

    // Build conversation messages
    const messages = [
      {
        role: 'user',
        parts: [{ text: systemMessage }]
      },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role === 'student' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Call Gemini Flash for fast VP chat
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const vpResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!vpResponse) {
      throw new Error('No response from Gemini');
    }

    console.log('VP Response generated:', vpResponse);

    // Store transcript in database (implement when Supabase is connected)
    // const { error: updateError } = await supabase
    //   .from('simulation_runs')
    //   .update({
    //     transcript: [...existingTranscript, 
    //       { role: 'student', content: message, timestamp: new Date().toISOString() },
    //       { role: 'patient', content: vpResponse, timestamp: new Date().toISOString() }
    //     ]
    //   })
    //   .eq('id', run_id);

    return new Response(
      JSON.stringify({
        success: true,
        response: vpResponse,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in student_message:', error);
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
