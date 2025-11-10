import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Reference citation helper
const getCitationForTopic = (topic: string): string => {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("agni") || topicLower.includes("appetite")) {
    return "Charaka Samhita — Vimana Sthana";
  }
  if (topicLower.includes("nadi") || topicLower.includes("pulse")) {
    return "Science of Nadi Vijnana — Clinical Applications";
  }
  if (topicLower.includes("jwara") || topicLower.includes("fever")) {
    return "Kayachikitsa: Principles and Practice — Chapter on Jwara";
  }
  if (topicLower.includes("socrates") || topicLower.includes("history")) {
    return "Clinical Methods in Ayurveda — History Taking";
  }
  if (topicLower.includes("physical exam") || topicLower.includes("examination")) {
    return "Clinical Methods in Ayurveda — Physical Examination Methods";
  }
  if (topicLower.includes("diagnosis") || topicLower.includes("differential")) {
    return "Clinical Methods in Ayurveda — Diagnostic Reasoning";
  }
  if (topicLower.includes("osce") || topicLower.includes("assessment")) {
    return "Virtual OSCE Guidelines — Rubric Development";
  }

  return "Clinical Methods in Ayurveda";
};

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
    
    if (!run_id || !caseData) {
      throw new Error('Missing required fields');
    }

    console.log('Scoring simulation run:', run_id);

    const transcriptArray = Array.isArray(transcript) ? transcript : [];
    const actionsArray = Array.isArray(actions) ? actions : [];

    // Rule-based scoring for structured actions
    const rubric = caseData.rubric || [];
    const achievedItems: Record<string, any> = {};
    const missedItems: any[] = [];
    const sections: any[] = [];
    let ruleBasedScore = 0;
    let maxScore = 0;
    
    // Build transcript text for LLM analysis
    const transcriptText = transcriptArray.map((msg: any) => 
      `${String(msg.role || 'unknown')}: ${String(msg.content || '')}`
    ).join('\n');

    // Score each section
    for (const section of rubric) {
      const sectionResult = {
        section: section.section,
        score: 0,
        max: section.max,
        items: [] as any[],
      };
      maxScore += section.max;

      for (const item of section.items) {
        const itemWeight = item.weight || 1;
        let achieved = false;
        let confidence = 0;
        let evidence = null;
        
        // Rule-based check for actions
        const actionMatch = actionsArray.find((action: any) => {
          const actionType = String(action.type || action.action || '').toLowerCase();
          const itemId = String(item.id || '').toLowerCase();
          const itemText = String(item.text || '').toLowerCase();
          return actionType.includes(itemId) || itemText.includes(actionType);
        });

        if (actionMatch) {
          achieved = true;
          confidence = 100;
          evidence = `Action performed: ${JSON.stringify(actionMatch)}`;
          ruleBasedScore += itemWeight;
          sectionResult.score += itemWeight;
        }

        sectionResult.items.push({
          id: item.id,
          text: item.text,
          achieved: achieved ? 1 : 0,
          evidence: evidence,
          tip: item.tip || null,
          reference: item.reference || null,
        });

        if (achieved) {
          achievedItems[item.id] = { achieved: true, confidence, method: 'rule-based' };
        } else {
          // Add to missed items for LLM analysis
          missedItems.push(item);
        }
      }

      sections.push(sectionResult);
    }

    // LLM-assisted scoring for missed items (transcript analysis)
    let llmScore = 0;
    const llmMatches: any[] = [];
    
    if (missedItems.length > 0 && transcriptText.length > 10) {
      const scoringPrompt = `You are scoring a medical student's Virtual OSCE performance.

RUBRIC ITEMS TO EVALUATE:
${JSON.stringify(missedItems.map(i => ({ id: i.id, text: i.text, weight: i.weight || 1 })), null, 2)}

STUDENT-PATIENT CONVERSATION:
${transcriptText}

For each rubric item, analyze if the student demonstrated the skill in the conversation.
Return confidence score (0-100) and brief evidence from transcript.

Return ONLY valid JSON in this format:
{
  "matches": [
    {
      "itemId": "H1",
      "demonstrated": true,
      "confidence": 85,
      "evidence": "Student asked 'where is the pain' at timestamp"
    }
  ]
}`;

      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
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
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const llmResult = JSON.parse(jsonMatch[0]);
            
            // Apply confidence thresholds
            for (const match of llmResult.matches || []) {
              const item = missedItems.find(i => i.id === match.itemId);
              if (!item) continue;

              const itemWeight = item.weight || 1;
              llmMatches.push({
                itemId: match.itemId,
                confidence: match.confidence,
              });

              // Update section scores based on confidence
              if (match.confidence >= 80) {
                // Auto-accept
                llmScore += itemWeight;
                const section = sections.find(s => s.items.some((i: any) => i.id === match.itemId));
                if (section) {
                  section.score += itemWeight;
                  const sectionItem = section.items.find((i: any) => i.id === match.itemId);
                  if (sectionItem) {
                    sectionItem.achieved = 1;
                    sectionItem.evidence = match.evidence;
                  }
                }
              } else if (match.confidence >= 50) {
                // Partial credit
                const partialPoints = itemWeight * 0.5;
                llmScore += partialPoints;
                const section = sections.find(s => s.items.some((i: any) => i.id === match.itemId));
                if (section) {
                  section.score += partialPoints;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('LLM scoring error:', e);
      }
    }

    // Calculate final scores
    const totalPoints = ruleBasedScore + llmScore;
    const percentage = maxScore > 0 ? Math.round((totalPoints / maxScore) * 100) : 0;
    const passed = percentage >= 60;

    // Generate missed checklist
    const missedChecklist = sections.flatMap(section =>
      section.items
        .filter((item: any) => item.achieved === 0)
        .map((item: any) => {
          // Generate appropriate citation based on item content
          const citation = getCitationForTopic(item.text);
          return {
            id: item.id,
            text: item.text,
            tip: item.tip || `Review the ${section.section} section`,
            resource: citation,
          };
        })
    );

    // Generate stepwise reasoning
    const reasoning = [
      `1. Identify red flags: Review chief complaint and key symptoms`,
      `2. Perform systematic examination: Nadi Pariksha and relevant physical exams`,
      `3. Order targeted investigations: Only tests relevant to clinical presentation`,
      `4. Formulate diagnosis: Based on Ayurvedic and modern diagnostic criteria`,
      `5. Plan management: Immediate interventions and follow-up care`,
    ];

    // Generate learning pearls with proper citations
    const pearls = [
      {
        text: `Station score: ${percentage}% - ${passed ? 'Passed' : 'Needs improvement'}`,
        ref: "Virtual OSCE Guidelines — Assessment Design Principles",
      },
      {
        text: "Order only relevant tests - unnecessary tests do not provide clinical value",
        ref: "Clinical Methods in Ayurveda — Diagnostic Reasoning",
      },
      {
        text: "Systematic history-taking using SOCRATES improves diagnostic accuracy",
        ref: "Clinical Methods in Ayurveda — History Taking in Ayurveda",
      },
    ];

    // Get MCQs from case data
    const mcqs = (caseData.mcqs || []).slice(0, 3).map((mcq: any) => ({
      id: mcq.id,
      stem: mcq.stem,
      choices: mcq.choices,
      correctIndex: mcq.correctIndex,
      explanation: mcq.rationale,
    }));

    // Final payload
    const result = {
      totalPoints: Math.round(totalPoints * 10) / 10,
      maxPoints: maxScore,
      percentage,
      passed,
      sections,
      missedItems: missedChecklist,
      reasoning,
      pearls,
      mcqs,
      llmMatches,
      modelOutputId: `score-${run_id}-${Date.now()}`,
    };

    console.log('Scoring complete:', { totalPoints, maxScore, percentage });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in score_case:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        totalPoints: 0,
        maxPoints: 0,
        percentage: 0,
        passed: false,
        sections: [],
        missedItems: [],
        reasoning: [],
        pearls: [],
        mcqs: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
