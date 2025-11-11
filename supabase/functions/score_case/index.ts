import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Reference citation helper - uses comprehensive Ayurvedic reference library
const getCitationForTopic = (topic: string): string => {
  const topicLower = topic.toLowerCase();

  // Map clinical topics to appropriate textbook citations
  if (topicLower.includes("agni") || topicLower.includes("appetite") || topicLower.includes("digestion")) {
    return "Dravyaguna Vigyana by Acharya Priyavrata Sharma, Chaukhambha Bharti Academy, Varanasi";
  }
  if (topicLower.includes("nadi") || topicLower.includes("pulse")) {
    return "Dravyagunavijnana by Prof. D.S. Lucas, Chaukhambha Visvabharati, Varanasi";
  }
  if (topicLower.includes("jwara") || topicLower.includes("fever") || topicLower.includes("pitta")) {
    return "Bhavaprakasha by Sri Brahmasankara Mishra, Chaukhamba Sanskrit Series Office, Varanasi";
  }
  if (topicLower.includes("socrates") || topicLower.includes("history") || topicLower.includes("onset")) {
    return "Introduction to Dravyaguna by Acharya Priyavrata Sharma, Chaukhambha Orientalia, Varanasi";
  }
  if (topicLower.includes("physical exam") || topicLower.includes("examination")) {
    return "Dravyagunavijnana by Prof. D.S. Lucas, Chaukhambha Visvabharati, Varanasi";
  }
  if (topicLower.includes("lab") || topicLower.includes("test") || topicLower.includes("investigation")) {
    return "Essentials of Medical Pharmacology by K.D. Tripathi, Jaypee Brothers Medical Publishers";
  }
  if (topicLower.includes("diagnosis") || topicLower.includes("differential")) {
    return "Ayurvedic Pharmacology & Therapeutic Uses of Medicinal Plants by Vaidya V.M. Gogte, Chaukhambha Publications";
  }
  if (topicLower.includes("management") || topicLower.includes("treatment") || topicLower.includes("therapy")) {
    return "Ayurvediya Aushadkarma Vigyana by Acharya V.J. Thakar, Gujarat Ayurveda University, Jamnagar";
  }
  if (topicLower.includes("cooling") || topicLower.includes("ors") || topicLower.includes("hydration")) {
    return "Evidence-Based Validation of Herbal Medicine by Pulok K. Mukherjee, Elsevier Science";
  }
  if (topicLower.includes("rasa") || topicLower.includes("taste")) {
    return "Raspanchaka by Prof. Shiv Charan Dhyani, Chaukhambha Krishnadas Academy, Varanasi";
  }
  if (topicLower.includes("vipaka") || topicLower.includes("virya") || topicLower.includes("prabhava")) {
    return "Research Updates of Vipaka by Vaidyabhushanam K. Raghavan Tirumulpad, Arya Vaidya Sala, Kottakkal";
  }
  if (topicLower.includes("guna") || topicLower.includes("properties")) {
    return "Dravyaguna Siddhanta by Prof. Shiv Charan Dhyani, Chaukhambha Krishnadas Academy, Varanasi";
  }
  if (topicLower.includes("communication") || topicLower.includes("rapport")) {
    return "Classical Uses of Medicinal Plants by Acharya Priyavrata Sharma, Chaukhamba Visvabharati, Varanasi";
  }
  if (topicLower.includes("osce") || topicLower.includes("assessment") || topicLower.includes("rubric")) {
    return "A Text Book of Dravyaguna Vijnana by Dr. Prakash L. Hegde and Dr. Harini A., Chaukhambha Publications";
  }

  // Default comprehensive reference
  return "Dravyaguna Vigyana by Acharya Priyavrata Sharma, Chaukhambha Bharti Academy, Varanasi";
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
    // Provide fallback rubric if none exists
    const rubric = caseData.rubric || [
      {
        section: "History Taking",
        max: 5,
        items: [
          { id: "H1", text: "Obtained chief complaint", weight: 1, tip: "Always start with the patient's main concern" },
          { id: "H2", text: "Asked about onset and duration", weight: 1, tip: "Timeline is crucial for diagnosis" },
          { id: "H3", text: "Inquired about aggravating factors", weight: 1, tip: "Understanding triggers helps management" },
          { id: "H4", text: "Asked about associated symptoms", weight: 1, tip: "Related symptoms provide diagnostic clues" },
          { id: "H5", text: "Explored patient's concerns", weight: 1, tip: "Patient-centered care improves outcomes" },
        ],
      },
      {
        section: "Diagnosis & Management",
        max: 5,
        items: [
          { id: "D1", text: "Formulated working diagnosis", weight: 2, tip: "Clear diagnosis guides treatment" },
          { id: "M1", text: "Proposed appropriate management", weight: 2, tip: "Evidence-based treatment is essential" },
          { id: "M2", text: "Explained treatment plan to patient", weight: 1, tip: "Patient understanding improves compliance" },
        ],
      },
      {
        section: "Clinical Resource Stewardship",
        max: 2,
        items: [
          { id: "RS1", text: "Ordered only relevant investigations (avoided unnecessary tests)", weight: 2, tip: "Good clinicians order targeted investigations, not shotgun testing" },
        ],
      },
    ];
    const achievedItems: Record<string, any> = {};
    const missedItems: any[] = [];
    const sections: any[] = [];
    let maxScore = 0;
    
    // Build transcript text for LLM analysis
    const transcriptText = transcriptArray.map((msg: any) => 
      `${String(msg.role || 'unknown')}: ${String(msg.content || '')}`
    ).join('\n');

    // Score each section - defer to LLM for accurate assessment
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
        
        // Initialize all items as not achieved - LLM will evaluate
        sectionResult.items.push({
          id: item.id,
          text: item.text,
          achieved: 0,
          evidence: null,
          tip: item.tip || null,
          reference: item.reference || null,
        });

        // Add all items for LLM analysis
        missedItems.push(item);
      }

      sections.push(sectionResult);
    }

    // OSCE-compliant LLM scoring with objective behavioral assessment
    let llmScore = 0;
    const llmMatches: any[] = [];
    
    if (missedItems.length > 0 && transcriptText.length > 10) {
      // Build comprehensive context for OSCE-style scoring
      const actionsText = actionsArray.map((a: any) => 
        `${a.type || a.action}: ${JSON.stringify(a)}`
      ).join('\n');

      const scoringPrompt = `You are an OSCE examiner scoring a medical student's virtual patient encounter using standardized OSCE methodology.

OSCE EVALUATION PRINCIPLES:
- Assess OBSERVABLE BEHAVIORS only (what student actually said/did)
- Use OBJECTIVE CRITERIA (did they perform the action? yes/no/partial)
- Apply CONSISTENT STANDARDS across all students
- Focus on COMPETENCY DEMONSTRATION (skill shown, not inferred)
- Award points based on EXPLICIT EVIDENCE in transcript/actions

**SPECIAL EVALUATION - Clinical Resource Stewardship (RS1):**
For criterion RS1 "Ordered only relevant investigations":
- Review all lab tests ordered by the student (look for "lab_ordered" actions)
- Identify which tests are RELEVANT (support the diagnosis) vs UNRELATED (normal/distractor tests)
- Full credit (confidence 90-100): Student ordered ONLY relevant tests, avoided unnecessary tests
- Partial credit (confidence 60-75): Student ordered mostly relevant tests but included 1 unnecessary test
- No credit (confidence 0-59): Student ordered multiple unnecessary tests (shotgun approach)
- This evaluates clinical reasoning and appropriate resource utilization

RUBRIC CRITERIA TO EVALUATE:
${JSON.stringify(missedItems.map(i => ({ 
  id: i.id, 
  criterion: i.text, 
  weight: i.weight || 1,
  section: sections.find(s => s.items.some((si: any) => si.id === i.id))?.section
})), null, 2)}

STUDENT PERFORMANCE RECORD:

Conversation Transcript:
${transcriptText}

Documented Actions:
${actionsText || "No documented actions"}

OSCE SCORING GUIDELINES:
- Confidence 90-100: Criterion fully met with clear, explicit demonstration
- Confidence 75-89: Criterion substantially met with good evidence
- Confidence 60-74: Criterion partially met or implied but not fully demonstrated
- Confidence 0-59: Criterion not adequately demonstrated or absent

EVALUATION INSTRUCTIONS:
1. For each criterion, identify specific evidence (quote what student said/did)
2. Match evidence to criterion using objective assessment
3. Assign confidence based on strength and clarity of demonstration
4. History-taking: Requires specific questions asked (not just discussed)
5. Physical exam: Requires explicit examination performed
6. Investigations: Requires clear ordering/requesting
7. Diagnosis: Requires explicit statement of working diagnosis
8. Management: Requires specific treatment plan articulated
9. **Resource Stewardship (RS1)**: Count lab tests ordered, identify relevant vs unrelated based on case diagnosis, score based on appropriateness

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "itemId": "H1",
      "demonstrated": true,
      "confidence": 85,
      "evidence": "Line 3: Student asked 'Can you tell me what brought you in today?' - explicitly elicited chief complaint"
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
          
          // Sanitize and extract JSON from response - try multiple strategies
          let llmResult = null;
          
          // Strategy 1: Find JSON between code blocks
          let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              llmResult = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.log('Failed to parse JSON from code block');
            }
          }
          
          // Strategy 2: Find any JSON object
          if (!llmResult) {
            jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              // Clean up common JSON issues
              let cleanedJson = jsonMatch[0]
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/\\n/g, ' ') // Replace escaped newlines
                .replace(/\n/g, ' ') // Replace actual newlines
                .replace(/\r/g, '') // Remove carriage returns
                .replace(/\t/g, ' ') // Replace tabs
                .replace(/\s+/g, ' '); // Normalize whitespace
              
              try {
                llmResult = JSON.parse(cleanedJson);
              } catch (e) {
                console.log('Failed to parse cleaned JSON:', e);
              }
            }
          }
          
          if (llmResult) {
            
            // Apply confidence thresholds
            for (const match of llmResult.matches || []) {
              const item = missedItems.find(i => i.id === match.itemId);
              if (!item) continue;

              const itemWeight = item.weight || 1;
              llmMatches.push({
                itemId: match.itemId,
                confidence: match.confidence,
              });

              // Update section scores based on strict confidence thresholds
              if (match.confidence >= 75) {
                // Full credit - clearly demonstrated
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
              } else if (match.confidence >= 60) {
                // Partial credit - partially demonstrated
                const partialPoints = itemWeight * 0.5;
                llmScore += partialPoints;
                const section = sections.find(s => s.items.some((i: any) => i.id === match.itemId));
                if (section) {
                  section.score += partialPoints;
                  const sectionItem = section.items.find((i: any) => i.id === match.itemId);
                  if (sectionItem) {
                    sectionItem.achieved = 0.5;
                    sectionItem.evidence = `Partial: ${match.evidence}`;
                  }
                }
              }
              // Below 60 confidence = no credit
            }
          } else {
            console.log('Could not extract valid JSON from LLM response');
          }
        } else {
          console.error('LLM API request failed:', response.status, await response.text());
        }
      } catch (e) {
        console.error('LLM scoring error:', e);
        // Continue with rule-based scoring only
      }
    }

    // Calculate final scores
    const totalPoints = llmScore;
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
