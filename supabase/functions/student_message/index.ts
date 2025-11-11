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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { run_id, message, conversationHistory, caseData } = await req.json();
    
    if (!run_id || !message || !caseData) {
      throw new Error('Missing required fields: run_id, message, or caseData');
    }

    console.log('Processing message for run:', run_id);

    // Build system message with case context
    const systemMessage = `You are a Virtual Patient in an Ayurvedic OSCE simulation.

CRITICAL RULES:
- Respond in 1-2 short sentences maximum (under 100 characters total)
- Use natural, conversational Indian English
- Be polite, warm, and realistic
- Include mild emotional cues ("I'm worried", "I feel anxious")
- Use Ayurvedic terms naturally when relevant ("My Agni feels weak", "I have burning sensation")
- NEVER reveal diagnosis or hidden medical terms
- NEVER use markdown, emojis, asterisks, or formatting
- Answer ONLY what is asked - don't volunteer extra information
- If question is unclear or not in your knowledge, say "I don't know" or "I just feel unwell"

PATIENT DETAILS:
Name: ${caseData.patient.name}
Age: ${caseData.patient.age}
Gender: ${caseData.patient.gender}
Presenting Complaint: ${caseData.stem}

KNOWLEDGE BASE (answer only when asked):
${Object.entries(caseData.script.history).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n')}

EXAM FINDINGS (reveal only if student explicitly requests examination):
${Object.entries(caseData.script.onRequestExam || {}).map(([exam, finding]) => `${exam}: ${finding}`).join('\n')}

LAB RESULTS (reveal only if student explicitly orders the test):
${Object.entries(caseData.script.labsOnOrder || {}).map(([lab, result]) => `${lab}: ${result}`).join('\n')}

Example good responses:
"Doctor, I feel very hot inside and thirsty."
"It started two days ago. I haven't eaten much."
"I'm worried this fever won't go away."
"My digestion feels weak and I get burning after meals."`;

    // Build conversation messages for Lovable AI
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call Lovable AI Gateway with Gemini Flash
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please contact support.');
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const vpResponse = data.choices?.[0]?.message?.content;
    
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
