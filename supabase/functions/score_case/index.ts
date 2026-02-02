import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// NCISM Domain types
type NCISMDomain = "History" | "Examination" | "Diagnosis" | "Management" | "Communication" | "Procedural" | "Resource Stewardship";

// Reference citation helper - uses comprehensive Ayurvedic reference library
const getCitationForTopic = (topic: string): string => {
  const topicLower = topic.toLowerCase();

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
  if (topicLower.includes("child") || topicLower.includes("pediatric") || topicLower.includes("kaumarabhritya")) {
    return "Kaumarabhritya (Ayurvedic Paediatrics) by Dr. A.K. Sharma, Chaukhambha Orientalia, Varanasi";
  }

  return "Dravyaguna Vigyana by Acharya Priyavrata Sharma, Chaukhambha Bharti Academy, Varanasi";
};

// Map NCISM domain from section name
const mapSectionToNCISMDomain = (sectionName: string): NCISMDomain => {
  const name = sectionName.toLowerCase();
  if (name.includes("history")) return "History";
  if (name.includes("exam") || name.includes("investigation")) return "Examination";
  if (name.includes("diagnosis") || name.includes("differential")) return "Diagnosis";
  if (name.includes("management") || name.includes("treatment")) return "Management";
  if (name.includes("communication") || name.includes("counsel")) return "Communication";
  if (name.includes("procedure") || name.includes("skill")) return "Procedural";
  if (name.includes("resource") || name.includes("stewardship")) return "Resource Stewardship";
  return "Diagnosis"; // Default
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { run_id, transcript, actions, caseData } = await req.json();
    
    if (!run_id || !caseData) {
      throw new Error('Missing required fields');
    }

    console.log('Scoring simulation run with NCISM 3-level rubric:', run_id);

    const transcriptArray = Array.isArray(transcript) ? transcript : [];
    const actionsArray = Array.isArray(actions) ? actions : [];

    // Check if this is a Kaumarabhritya (pediatric) case
    const isChildCase = caseData.childAppropriate || 
      caseData.subject?.toLowerCase().includes("kaumarabhritya") ||
      (caseData.patient?.age && caseData.patient.age < 12);

    // Provide fallback rubric if none exists - now with NCISM structure
    const rubric = caseData.rubric || [
      {
        section: "History Taking",
        max: 10,
        ncismDomain: "History",
        millerLevel: "ShowsHow",
        items: [
          { 
            id: "H1", 
            text: "Elicited chief complaint with SOCRATES approach", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "History",
            scoringCriteria: {
              score0: "Did not ask about primary symptoms",
              score1: "Asked generally but missed specific characterization",
              score2: "Explicitly elicited onset, duration, character, and severity"
            },
            implicitReasoningCues: ["when started", "how long", "describe", "onset", "duration"]
          },
          { 
            id: "H2", 
            text: "Explored aggravating and relieving factors", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "History",
            scoringCriteria: {
              score0: "Did not explore",
              score1: "Asked about one factor only",
              score2: "Systematically explored both aggravating and relieving factors"
            },
            implicitReasoningCues: ["worse when", "better after", "triggers", "relief"]
          },
          { 
            id: "H3", 
            text: "Inquired about associated symptoms", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "History"
          },
          { 
            id: "H4", 
            text: "Assessed Ayurvedic history (Agni, Koshtha, Prakriti)", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "History",
            implicitReasoningCues: ["appetite", "digestion", "bowel", "sleep", "constitution"]
          },
          { 
            id: "H5", 
            text: "Explored lifestyle and social context (Vihara, Achara)", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "History"
          },
        ],
      },
      {
        section: "Examination & Investigation",
        max: 10,
        ncismDomain: "Examination",
        millerLevel: "ShowsHow",
        items: [
          { 
            id: "E1", 
            text: "Performed Nadi Pariksha with dosha interpretation", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Examination",
            scoringCriteria: {
              score0: "Did not perform pulse examination",
              score1: "Performed Nadi Pariksha but did not interpret",
              score2: "Performed and verbalized dosha characteristics"
            }
          },
          { 
            id: "E2", 
            text: "Assessed relevant physical signs (tongue, skin, etc.)", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Examination"
          },
          { 
            id: "E3", 
            text: "Ordered relevant investigations", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Examination"
          },
          { 
            id: "E4", 
            text: "Interpreted investigation results appropriately", 
            maxMarks: 2,
            millerLevel: "KnowsHow",
            ncismDomain: "Examination"
          },
          { 
            id: "E5", 
            text: "Integrated Ayurvedic and modern examination findings", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Examination"
          },
        ],
      },
      {
        section: "Diagnosis",
        max: 4,
        ncismDomain: "Diagnosis",
        millerLevel: "KnowsHow",
        items: [
          { 
            id: "D1", 
            text: "Formulated correct Ayurvedic diagnosis with dosha identification", 
            maxMarks: 2,
            millerLevel: "KnowsHow",
            ncismDomain: "Diagnosis",
            scoringCriteria: {
              score0: "Incorrect or no diagnosis stated",
              score1: "Partially correct diagnosis or missing dosha component",
              score2: "Complete diagnosis with correct dosha identification"
            }
          },
          { 
            id: "D2", 
            text: "Considered appropriate differential diagnoses", 
            maxMarks: 2,
            millerLevel: "KnowsHow",
            ncismDomain: "Diagnosis"
          },
        ],
      },
      {
        section: "Management",
        max: 4,
        ncismDomain: "Management",
        millerLevel: "ShowsHow",
        items: [
          { 
            id: "M1", 
            text: "Proposed appropriate Ayurvedic management plan", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Management"
          },
          { 
            id: "M2", 
            text: "Explained treatment and follow-up to patient", 
            maxMarks: 2,
            millerLevel: "ShowsHow",
            ncismDomain: "Communication"
          },
        ],
      },
      {
        section: "Clinical Resource Stewardship",
        max: 2,
        ncismDomain: "Resource Stewardship",
        millerLevel: "Does",
        items: [
          { 
            id: "RS1", 
            text: "Ordered only relevant investigations (avoided unnecessary tests)", 
            maxMarks: 2,
            millerLevel: "Does",
            ncismDomain: "Resource Stewardship",
            scoringCriteria: {
              score0: "Ordered multiple unnecessary tests (shotgun approach)",
              score1: "Ordered mostly relevant tests but included 1 unnecessary test",
              score2: "Ordered only relevant, targeted investigations"
            }
          },
        ],
      },
    ];

    const sections: any[] = [];
    let maxScore = 0;
    const allItems: any[] = [];
    
    // Build transcript text for LLM analysis
    const transcriptText = transcriptArray.map((msg: any) => 
      `${String(msg.role || 'unknown')}: ${String(msg.content || '')}`
    ).join('\n');

    // Prepare items for scoring
    for (const section of rubric) {
      const sectionResult = {
        section: section.section,
        score: 0,
        max: section.max || section.items.reduce((sum: number, item: any) => sum + (item.maxMarks || item.weight || 2), 0),
        ncismDomain: section.ncismDomain || mapSectionToNCISMDomain(section.section),
        millerLevel: section.millerLevel || "ShowsHow",
        items: [] as any[],
      };

      for (const item of section.items) {
        const itemMaxMarks = item.maxMarks || item.weight || 2;
        maxScore += itemMaxMarks;

        sectionResult.items.push({
          id: item.id,
          text: item.text,
          maxMarks: itemMaxMarks,
          achieved: 0,
          score: 0,
          evidence: null,
          tip: item.tip || item.examinerNotes || null,
          reference: item.reference || null,
          millerLevel: item.millerLevel || section.millerLevel || "ShowsHow",
          ncismDomain: item.ncismDomain || section.ncismDomain || mapSectionToNCISMDomain(section.section),
          implicitCredit: false,
          notApplicable: item.notApplicable || false,
        });

        allItems.push({
          ...item,
          sectionName: section.section,
          maxMarks: itemMaxMarks,
        });
      }

      sections.push(sectionResult);
    }

    // NCISM-compliant LLM scoring with 3-level scale
    let totalPoints = 0;
    const llmMatches: any[] = [];
    
    if (allItems.length > 0 && transcriptText.length > 10) {
      const actionsText = actionsArray.map((a: any) => 
        `${a.type || a.action}: ${JSON.stringify(a)}`
      ).join('\n');

      // Build comprehensive criteria list with scoring criteria
      const criteriaList = allItems.map(item => ({
        id: item.id,
        criterion: item.text,
        section: item.sectionName,
        maxMarks: item.maxMarks,
        millerLevel: item.millerLevel || "ShowsHow",
        ncismDomain: item.ncismDomain || mapSectionToNCISMDomain(item.sectionName),
        scoringCriteria: item.scoringCriteria || {
          score0: "Not demonstrated or incorrect",
          score1: "Partially demonstrated or implicit understanding",
          score2: "Fully demonstrated with explicit evidence"
        },
        implicitReasoningCues: item.implicitReasoningCues || [],
      }));

      const scoringPrompt = `You are an NCISM-trained OSCE examiner assessing a BAMS student using competency-based medical education (CBME) principles.

## NCISM 3-LEVEL SCORING SCALE (for each criterion):
- **2 = Fully demonstrated**: Explicit, correct, and complete demonstration
- **1 = Partially demonstrated**: Implicit understanding shown OR incomplete demonstration
- **0 = Not demonstrated**: Absent, incorrect, or inadequate
- **N/A = Not applicable**: Criterion not relevant to this station (exclude from max score)

## IMPLICIT REASONING CREDIT RULES (CRITICAL):
- Award Score 1 (Partial) if student demonstrates UNDERSTANDING without using exact terminology
- Example: Student says "episodic breathlessness with wheezing, worse at night" → Award partial credit for "Identifies Tamaka Shwasa" even without naming it
- Example: Student orders relevant labs without explicitly stating the differential → Award partial credit for "Demonstrates clinical reasoning"
- Do NOT penalize for missing Sanskrit terms if the clinical concept is understood
- Prioritize CLINICAL COMPETENCE over TERMINOLOGICAL PRECISION

## NCISM GRADUATE ATTRIBUTES ASSESSED:
- Clinician: History taking, examination, diagnosis
- Communicator: Patient rapport, explanation, counseling  
- Leader/Manager: Resource stewardship, appropriate referrals
- Professional: Ethics, documentation, accountability
- Scholar: Evidence-based reasoning, learning orientation

${isChildCase ? `
## KAUMARABHRITYA (PEDIATRIC) SPECIAL RULES:
- Award extra credit for age-appropriate dose calculations
- Score 0 if adult doses suggested without modification for children
- Award credit for recognizing when Shodhana (Panchakarma) is contraindicated in young children (<12 years)
- Evaluate parent counseling quality (not just patient communication)
- Credit for developmentally appropriate examination techniques
` : ''}

## RUBRIC CRITERIA TO EVALUATE:
${JSON.stringify(criteriaList, null, 2)}

## STUDENT PERFORMANCE RECORD:

### Conversation Transcript:
${transcriptText}

### Documented Actions:
${actionsText || "No documented actions recorded"}

## EVALUATION INSTRUCTIONS:
1. For each criterion, identify SPECIFIC EVIDENCE from transcript/actions
2. Quote exactly what the student said/did as evidence
3. Apply 3-level scoring based on clarity and completeness of demonstration
4. Award Score 1 for implicit reasoning that shows understanding
5. Use N/A only when criterion is genuinely inapplicable to this station
6. For Resource Stewardship (RS1): Count tests ordered, identify relevant vs unnecessary based on case diagnosis

## CONFIDENCE-TO-SCORE MAPPING:
- Confidence ≥85% → Score 2 (Fully demonstrated)
- Confidence 65-84% → Score 1 (Partially demonstrated)
- Confidence <65% → Score 0 (Not demonstrated)

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "itemId": "H1",
      "score": 2,
      "confidence": 92,
      "reasoning": "Student explicitly asked: 'When did the fever start and how would you describe it?' - demonstrates full SOCRATES approach",
      "implicitCredit": false,
      "evidence": "Line 3: 'When did the fever start...'"
    },
    {
      "itemId": "H4",
      "score": 1,
      "confidence": 72,
      "reasoning": "Student asked about appetite and digestion but did not explicitly assess Koshtha or Prakriti",
      "implicitCredit": true,
      "evidence": "Line 8: 'How is your appetite? Any changes in digestion?'"
    }
  ],
  "globalRating": "Competent",
  "overallComments": "Demonstrates solid clinical reasoning with minor gaps in Ayurvedic documentation"
}`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              {
                role: 'user',
                content: scoringPrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content || '';
          
          console.log('LLM Response received, length:', responseText.length);
          
          let llmResult = null;
          try {
            llmResult = JSON.parse(responseText);
            console.log('Successfully parsed JSON with', llmResult.matches?.length || 0, 'matches');
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
            console.log('Response text:', responseText.substring(0, 500));
          }
          
          if (llmResult) {
            // Apply 3-level scoring from LLM results
            for (const match of llmResult.matches || []) {
              const item = allItems.find(i => i.id === match.itemId);
              if (!item) continue;

              const itemMaxMarks = item.maxMarks || 2;
              let pointsEarned = 0;

              // Handle N/A case
              if (match.score === "N/A") {
                const section = sections.find(s => s.items.some((i: any) => i.id === match.itemId));
                if (section) {
                  section.max -= itemMaxMarks; // Reduce max score for N/A items
                  maxScore -= itemMaxMarks;
                  const sectionItem = section.items.find((i: any) => i.id === match.itemId);
                  if (sectionItem) {
                    sectionItem.achieved = "N/A";
                    sectionItem.notApplicable = true;
                  }
                }
                continue;
              }

              // Calculate points based on 3-level score
              const score = typeof match.score === 'number' ? match.score : 0;
              if (score === 2) {
                pointsEarned = itemMaxMarks; // Full credit
              } else if (score === 1) {
                pointsEarned = itemMaxMarks * 0.5; // Half credit
              } else {
                pointsEarned = 0; // No credit
              }

              totalPoints += pointsEarned;

              llmMatches.push({
                itemId: match.itemId,
                score: match.score,
                confidence: match.confidence,
                implicitCredit: match.implicitCredit || false,
              });

              // Update section scores
              const section = sections.find(s => s.items.some((i: any) => i.id === match.itemId));
              if (section) {
                section.score += pointsEarned;
                const sectionItem = section.items.find((i: any) => i.id === match.itemId);
                if (sectionItem) {
                  sectionItem.achieved = score === 2 ? 1 : (score === 1 ? 0.5 : 0);
                  sectionItem.score = pointsEarned;
                  sectionItem.evidence = match.evidence || match.reasoning;
                  sectionItem.implicitCredit = match.implicitCredit || false;
                }
              }
            }
          }
        } else {
          const errorText = await response.text();
          console.error('LLM API request failed:', response.status, errorText);
        }
      } catch (e) {
        console.error('LLM scoring error:', e);
      }
    }

    // Calculate final scores with NCISM grade bands
    const percentage = maxScore > 0 ? Math.round((totalPoints / maxScore) * 100) : 0;
    
    // NCISM Grade Bands
    let grade: string;
    let globalRating: string;
    let gradeDescription: string;
    
    if (percentage >= 85) {
      grade = "Distinction";
      globalRating = "Excellent";
      gradeDescription = "Exceeds expected competency for year level";
    } else if (percentage >= 70) {
      grade = "Pass (Competent)";
      globalRating = "Competent";
      gradeDescription = "Meets expected competency for year level";
    } else if (percentage >= 60) {
      grade = "Borderline";
      globalRating = "Borderline";
      gradeDescription = "Demonstrates potential but requires targeted practice before re-assessment";
    } else {
      grade = "Not Yet Competent";
      globalRating = "NotReady";
      gradeDescription = "Requires structured remediation program and faculty-supervised re-attempt";
    }

    const passed = percentage >= 70; // NCISM passing threshold

    // Generate missed checklist with NCISM-aligned feedback
    const missedChecklist = sections.flatMap(section =>
      section.items
        .filter((item: any) => item.achieved === 0 && item.achieved !== "N/A")
        .map((item: any) => {
          const citation = getCitationForTopic(item.text);
          return {
            id: item.id,
            text: item.text,
            tip: item.tip || `Review the ${section.section} competency`,
            resource: citation,
            ncismDomain: item.ncismDomain,
            millerLevel: item.millerLevel,
          };
        })
    );

    // Generate partial credit items (for student feedback)
    const partialCreditItems = sections.flatMap(section =>
      section.items
        .filter((item: any) => item.achieved === 0.5)
        .map((item: any) => ({
          id: item.id,
          text: item.text,
          evidence: item.evidence,
          tip: "Demonstrated understanding but needs more explicit verbalization",
          implicitCredit: item.implicitCredit,
        }))
    );

    // Generate stepwise reasoning
    const reasoning = [
      `1. Identify red flags: Review chief complaint and key presenting symptoms`,
      `2. Systematic history: Apply SOCRATES approach for symptom characterization`,
      `3. Ayurvedic assessment: Perform Nadi Pariksha and assess Agni, Koshtha, Prakriti`,
      `4. Targeted investigations: Order only clinically indicated tests`,
      `5. Formulate diagnosis: Integrate Ayurvedic and modern diagnostic criteria`,
      `6. Plan management: Propose evidence-based Ayurvedic treatment with follow-up`,
    ];

    // Generate learning pearls with proper citations
    const pearls = [
      {
        text: `Station result: ${percentage}% — ${grade}`,
        ref: "NCISM CBME Assessment Guidelines",
      },
      {
        text: "Implicit clinical reasoning earns partial credit — verbalize your thinking for full marks",
        ref: "OSCE Best Practices — Miller's Pyramid Assessment",
      },
      {
        text: "Order only relevant tests — unnecessary investigations reduce Resource Stewardship score",
        ref: "Clinical Methods in Ayurveda — Diagnostic Reasoning",
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

    // Domain-wise breakdown for debrief
    const domainBreakdown: Record<NCISMDomain, { score: number; max: number }> = {
      "History": { score: 0, max: 0 },
      "Examination": { score: 0, max: 0 },
      "Diagnosis": { score: 0, max: 0 },
      "Management": { score: 0, max: 0 },
      "Communication": { score: 0, max: 0 },
      "Procedural": { score: 0, max: 0 },
      "Resource Stewardship": { score: 0, max: 0 },
    };

    for (const section of sections) {
      const domain = section.ncismDomain as NCISMDomain;
      if (domainBreakdown[domain]) {
        domainBreakdown[domain].score += section.score;
        domainBreakdown[domain].max += section.max;
      }
    }

    // Final payload with NCISM structure
    const result = {
      // Core scores
      totalPoints: Math.round(totalPoints * 10) / 10,
      maxPoints: maxScore,
      percentage,
      passed,
      grade,
      globalRating,
      gradeDescription,
      
      // Section breakdown
      sections,
      
      // NCISM domain breakdown
      domainBreakdown,
      
      // Feedback items
      missedItems: missedChecklist,
      partialCreditItems,
      
      // Learning support
      reasoning,
      pearls,
      mcqs,
      
      // Audit trail
      llmMatches,
      scoringVersion: "NCISM-3Level-v1",
      modelOutputId: `score-${run_id}-${Date.now()}`,
      
      // Case metadata
      isChildCase,
      passingThreshold: 70,
    };

    console.log('NCISM Scoring complete:', { 
      totalPoints, 
      maxScore, 
      percentage, 
      grade,
      globalRating,
      implicitCreditCount: partialCreditItems.length 
    });

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
        grade: "Error",
        globalRating: "NotReady",
        sections: [],
        missedItems: [],
        partialCreditItems: [],
        reasoning: [],
        pearls: [],
        mcqs: [],
        scoringVersion: "NCISM-3Level-v1",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
