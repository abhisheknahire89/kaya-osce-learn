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

    const { run_id, transcript, actions, caseData } = await req.json();
    
    if (!run_id || !transcript || !caseData) {
      throw new Error('Missing required fields');
    }

    console.log('Scoring case for run:', run_id);

    // Rule-based scoring for actions
    const actionScores: any = {};
    let actionPoints = 0;
    
    // Check required actions from rubric
    caseData.rubric.forEach((section: any) => {
      section.items.forEach((item: any) => {
        // Simple action matching (in real implementation, use more sophisticated matching)
        const actionPerformed = actions.some((action: any) => 
          action.toLowerCase().includes(item.id.toLowerCase()) ||
          item.text.toLowerCase().includes(action.toLowerCase())
        );
        
        actionScores[item.id] = {
          performed: actionPerformed,
          points: actionPerformed ? item.weight : 0,
          feedback: actionPerformed ? 'Completed' : 'Not performed'
        };
        
        if (actionPerformed) {
          actionPoints += item.weight;
        }
      });
    });

    // LLM-assisted scoring for communication and open-ended responses
    const conversationText = transcript
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const scoringPrompt = `Analyze this student-patient conversation and score the communication and clinical reasoning based on the rubric.

RUBRIC:
${JSON.stringify(caseData.rubric, null, 2)}

CONVERSATION:
${conversationText}

For each rubric item, provide:
1. Whether the student demonstrated the skill (yes/no)
2. Confidence score (0-1)
3. Brief feedback

Return JSON format:
{
  "scores": [
    {
      "itemId": "string",
      "demonstrated": boolean,
      "confidence": number,
      "feedback": "string"
    }
  ]
}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: scoringPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini scoring API error:', response.status);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const scoringText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let llmScores = { scores: [] };
    if (scoringText) {
      try {
        const jsonMatch = scoringText.match(/```json\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : scoringText;
        llmScores = JSON.parse(jsonText);
      } catch (e) {
        console.error('Error parsing LLM scores:', e);
      }
    }

    // Calculate total score
    const maxPoints = caseData.rubric.reduce((sum: number, section: any) => 
      sum + section.max, 0
    );

    let totalPoints = actionPoints;
    const combinedScores = { ...actionScores };

    llmScores.scores.forEach((score: any) => {
      if (score.demonstrated && score.confidence > 0.6) {
        const item = caseData.rubric
          .flatMap((s: any) => s.items)
          .find((i: any) => i.id === score.itemId);
        
        if (item && !combinedScores[score.itemId]?.performed) {
          totalPoints += item.weight * score.confidence;
          combinedScores[score.itemId] = {
            performed: true,
            points: item.weight * score.confidence,
            feedback: score.feedback,
            confidence: score.confidence
          };
        }
      }
    });

    const percentageScore = Math.round((totalPoints / maxPoints) * 100);
    const passed = percentageScore >= 60;

    // Store score in database (implement when Supabase is connected)
    // const { error: updateError } = await supabase
    //   .from('simulation_runs')
    //   .update({
    //     score_json: {
    //       total_points: totalPoints,
    //       max_points: maxPoints,
    //       percentage: percentageScore,
    //       passed,
    //       item_scores: combinedScores,
    //       scored_at: new Date().toISOString()
    //     },
    //     end_at: new Date().toISOString(),
    //     status: 'completed'
    //   })
    //   .eq('id', run_id);

    return new Response(
      JSON.stringify({
        success: true,
        score: {
          total_points: totalPoints,
          max_points: maxPoints,
          percentage: percentageScore,
          passed,
          item_scores: combinedScores,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in score_case:', error);
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
