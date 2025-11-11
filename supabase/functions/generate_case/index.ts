import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate human-readable preview overview (transient, not stored)
function generatePreviewOverview(caseData: any): string {
  const rubricHighlights = caseData.rubric
    ?.slice(0, 3)
    ?.map((section: any, idx: number) => {
      const firstItem = section.items?.[0];
      return `${idx + 1}. ${section.section}: ${firstItem?.text || 'N/A'} (${section.max} pts)`;
    })
    .join('\n') || 'No rubric items';

  const mcqStems = caseData.mcqs
    ?.slice(0, 3)
    ?.map((mcq: any, idx: number) => `${idx + 1}. ${mcq.stem}`)
    .join('\n') || 'No MCQs';

  return `
**Title:** ${caseData.title}
**Subject:** ${caseData.subject}
**Duration:** ${caseData.durationMinutes} minutes
**Miller Level:** ${caseData.millerLevel}
**Bloom Domain:** ${caseData.bloomDomain}

**Competency IDs:** ${caseData.competencyIds?.join(', ') || 'None'}
**SLO IDs:** ${caseData.sloIds?.join(', ') || 'None'}

**Patient Stem:**
${caseData.stem}

**Top Rubric Highlights:**
${rubricHighlights}

**MCQ Count:** ${caseData.mcqs?.length || 0}
**Sample MCQ Stems:**
${mcqStems}

**Notes for Faculty:** Review Nadi triggers and test mappings for clinical accuracy.
`.trim();
}

// Generation parameters schema
const GenerateCaseParamsSchema = z.object({
  subject: z.string(),
  sloIds: z.array(z.string()),
  millerLevel: z.enum(["Knows", "KnowsHow", "ShowsHow", "Does"]),
  bloomDomain: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  durationMinutes: z.number().positive(),
  faculty_id: z.string(),
  ayurvedicContext: z.object({
    doshaFocus: z.array(z.enum(["Vata", "Pitta", "Kapha"])).optional(),
    specialModality: z.string().optional(),
  }).optional(),
});

// ClinicalCase validation schema (simplified for validation)
const ClinicalCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  subject: z.string(),
  competencyIds: z.array(z.string()),
  sloIds: z.array(z.string()),
  millerLevel: z.enum(["Knows", "KnowsHow", "ShowsHow", "Does"]),
  bloomDomain: z.string(),
  durationMinutes: z.number(),
  patient: z.object({
    name: z.string(),
    age: z.number(),
    gender: z.string(),
    language_preference: z.string(),
  }),
  stem: z.string(),
  vitals: z.record(z.union([z.string(), z.number()])),
  script: z.any(),
  rubric: z.array(z.any()),
  mcqs: z.array(z.any()),
  diagnosisOptions: z.array(z.any()).optional(),
  managementOptions: z.array(z.any()).optional(),
  metadata: z.any(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          error: 'AI_KEY_NOT_CONFIGURED',
          message: 'Veda AI is not configured. Please contact support for assistance.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const params = GenerateCaseParamsSchema.parse(await req.json());
    console.log('Generating case with params:', params);

    // Build Gemini prompt
    const systemPrompt = `You are "Kaya Case Generator", an evidence-aware clinical case author for Ayurvedic undergraduate training aligned to NCISM CBDC. 

CRITICAL: Output ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT add any explanatory text before or after the JSON.

Use English for clinical text. Add Devanagari headings where specified. 

IMPORTANT RUBRIC STRUCTURE:
Every case MUST include a "Clinical Resource Stewardship" section in the rubric with this exact structure:
{
  "section": "Clinical Resource Stewardship",
  "max": 2,
  "items": [
    { 
      "id": "RS1", 
      "text": "Ordered only relevant investigations (avoided unnecessary tests)", 
      "weight": 2,
      "tip": "Good clinicians order targeted investigations, not shotgun testing"
    }
  ]
}

IMPORTANT CITATION RULES:
1. For RUBRIC items (case reasoning, clinical assessment): Include evidence-based citations from the reference PDF at /public/references/References_Books_Resources.pdf. Use format: [file-REFERENCE-NAME] where REFERENCE-NAME matches a book from the PDF (e.g., [file-CHARAKA-SAMHITA], [file-BHAVAPRAKASHA], [file-KAYACHIKITSA-TEXTBOOK]).
2. For MCQ rationales: Do NOT include citations. Keep them concise and educational without references.
3. Rubric items must cite authoritative Ayurvedic texts to justify clinical reasoning and assessment criteria.

Examples:
- Rubric item: "Correctly identifies Kapha-Vata imbalance as primary pathology [file-CHARAKA-SAMHITA]"
- MCQ rationale: "This presentation indicates Tamaka Shwasa due to episodic dyspnoea and wheezing, classically aggravated by cold."`;

const userPrompt = `Create a ClinicalCase JSON object with these parameters:
- subject: ${params.subject}
- sloIds: ${params.sloIds.join(", ")}
- millerLevel: ${params.millerLevel}
- bloomDomain: ${params.bloomDomain}
- difficulty: ${params.difficulty}
- duration: ${params.durationMinutes} minutes
${params.ayurvedicContext?.doshaFocus ? `- doshaFocus: ${params.ayurvedicContext.doshaFocus.join(", ")}` : ''}
${params.ayurvedicContext?.specialModality ? `- specialModality: ${params.ayurvedicContext.specialModality}` : ''}
- tone: "Ayurvedic clinical, calm, mentor-like"
- localContext: "India, outpatient primary care"

**CRITICAL FOR CLINICAL REASONING**: Include UNRELATED/NORMAL findings to test discriminative thinking:
- Add at least 1-2 physical examination findings that are NORMAL or UNRELATED to the diagnosis (e.g., "Cardiovascular: S1 S2 normal, no murmurs" for a respiratory case)
- Add at least 1-2 lab tests that are NORMAL or UNRELATED to the diagnosis (e.g., "Liver function tests: Normal" for a fever case, "Blood glucose: 95 mg/dL - Normal" for non-metabolic cases)
- These distractor findings should be clinically appropriate but not diagnostically relevant
- Use normalized, realistic values (e.g., BP: 120/80 mmHg, Hemoglobin: 13.5 g/dL - Normal range)
- This tests whether students can identify relevant vs. irrelevant clinical data

**CRITICAL FOR DIAGNOSIS OPTIONS**: You MUST generate exactly 4 diagnosis options with SPECIFIC, REALISTIC NAMES:
- Option D1 (isCorrect: true): The CORRECT primary diagnosis with full Ayurvedic/biomedical name (e.g., "Pittaja Jwara - Pitta dominant fever")
- Option D2 (isCorrect: false): First differential diagnosis with specific name (e.g., "Kaphaja Jwara - Kapha fever")
- Option D3 (isCorrect: false): Second differential with specific name (e.g., "Viral Fever with Pitta aggravation")
- Option D4 (isCorrect: false): Always "Other (enter diagnosis below)"
NEVER use generic placeholders like "Primary diagnosis" or "Alternative diagnosis 1".

**CRITICAL FOR MANAGEMENT OPTIONS**: You MUST generate exactly 4 initial management plan options:
- Option M1 (isCorrect: true): The CORRECT best initial management/treatment for this case
- Option M2 (isCorrect: false): A plausible but suboptimal option commonly confused
- Option M3 (isCorrect: false): Another plausible but incorrect option
- Option M4 (isCorrect: false): "Other (enter plan below)"
Each option should be concise, clinically realistic, and aligned to the case context.

Required JSON structure:
{
  "id": "uuid-string",
  "title": "descriptive title",
  "slug": "url-friendly-slug",
  "subject": "${params.subject}",
  "competencyIds": ["array of competency IDs"],
  "sloIds": ${JSON.stringify(params.sloIds)},
  "millerLevel": "${params.millerLevel}",
  "bloomDomain": "${params.bloomDomain}",
  "durationMinutes": ${params.durationMinutes},
  "patient": {
    "name": "patient name",
    "age": number,
    "gender": "M/F/Other",
    "language_preference": "English"
  },
  "stem": "clinical scenario description",
  "vitals": { "key": "value" pairs },
  "script": {
    "history": { "question": "response" pairs },
    "onRequestExam": { 
      "relevant_finding_1": "findings related to diagnosis",
      "relevant_finding_2": "findings related to diagnosis",
      "unrelated_finding_1": "Normal cardiovascular examination: S1 S2 normal, no murmurs",
      "unrelated_finding_2": "Normal neurological examination: Cranial nerves intact, reflexes 2+ bilaterally"
    },
    "labsOnOrder": { 
      "relevant_test_1": "abnormal result supporting diagnosis",
      "relevant_test_2": "abnormal result supporting diagnosis",
      "unrelated_test_1": "Blood glucose: 95 mg/dL (Normal: 70-100 mg/dL)",
      "unrelated_test_2": "Liver function tests: AST 28 U/L, ALT 32 U/L (Normal range)"
    },
    "dynamicTriggers": { "trigger": ["responses"] }
  },
  "diagnosisOptions": [
    {
      "id": "D1",
      "text": "The primary diagnosis name matching the case (e.g., Pittaja Jwara - Pitta dominant fever)",
      "hint": "Based on presenting symptoms and clinical findings",
      "isCorrect": true,
      "sloIds": ["relevant SLO IDs from the case"]
    },
    {
      "id": "D2", 
      "text": "First plausible differential diagnosis name (e.g., Viral Fever, Kaphaja Jwara)",
      "hint": "A differential diagnosis that shares some symptoms",
      "isCorrect": false,
      "sloIds": ["relevant SLO IDs"]
    },
    {
      "id": "D3",
      "text": "Second plausible differential diagnosis name (e.g., Malaria, Vataja Jwara)",
      "hint": "Another differential diagnosis to consider",
      "isCorrect": false,
      "sloIds": ["relevant SLO IDs"]
    },
    {
      "id": "D4",
      "text": "Other (enter diagnosis below)",
      "hint": "Free-text diagnosis if none above fit",
      "isCorrect": false
    }
  ],
  "managementOptions": [
    {
      "id": "M1",
      "text": "The best initial management option specific to this case",
      "hint": "Aligned with key findings and safety",
      "isCorrect": true,
      "sloIds": ["relevant SLO IDs"]
    },
    {
      "id": "M2",
      "text": "Plausible but suboptimal management option",
      "hint": "Commonly selected but not ideal",
      "isCorrect": false
    },
    {
      "id": "M3",
      "text": "Another plausible but incorrect option",
      "hint": "Not recommended for initial management",
      "isCorrect": false
    },
    {
      "id": "M4",
      "text": "Other (enter plan below)",
      "hint": "Free-text plan if none above fit",
      "isCorrect": false
    }
  ],
  "rubric": [
    {
      "section": "section name",
      "max": number,
      "items": [
        { "id": "item-id", "text": "criteria", "weight": number }
      ]
    },
    {
      "section": "Clinical Resource Stewardship",
      "max": 2,
      "items": [
        { 
          "id": "RS1", 
          "text": "Ordered only relevant investigations (avoided unnecessary tests)", 
          "weight": 2,
          "tip": "Good clinicians order targeted investigations, not shotgun testing",
          "reference": "Clinical reasoning and resource stewardship principles"
        }
      ]
    }
  ],
  "mcqs": [
    {
      "id": "mcq-id",
      "stem": "question",
      "choices": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "rationale": "explanation",
      "sloId": "slo-id"
    }
  ],
  "metadata": {
    "createdAt": "ISO date string",
    "createdBy": "ai-generator"
  }
}

Output ONLY the JSON object, no markdown formatting.`;

    let attempts = 0;
    let generatedCase = null;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !generatedCase) {
      attempts++;
      console.log(`Generation attempt ${attempts}/${maxAttempts}`);

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192, // Increased for complex cases
            responseMimeType: "application/json", // Request JSON directly
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        return new Response(
          JSON.stringify({
            error: 'AI_GENERATION_ERROR',
            message: 'Veda AI encountered an error while generating the case. Please try again.',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No text generated from Gemini');
      }

      console.log('Raw generated text (first 200 chars):', generatedText.substring(0, 200));

      // Extract JSON from markdown code blocks - try multiple patterns
      let jsonText = generatedText.trim();
      
      // Try pattern 1: ```json\n...\n```
      let jsonMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log('Extracted with pattern 1 (```json)');
      } else {
        // Try pattern 2: ```\n...\n```
        jsonMatch = jsonText.match(/```\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
          console.log('Extracted with pattern 2 (```)');
        } else {
          // Try pattern 3: Remove any leading/trailing backticks
          jsonText = jsonText.replace(/^```(?:json)?\s*\n?/g, '').replace(/\n?```\s*$/g, '');
          console.log('Cleaned up with pattern 3 (remove backticks)');
        }
      }

      // Final cleanup: trim whitespace
      jsonText = jsonText.trim();
      console.log('Final JSON text (first 200 chars):', jsonText.substring(0, 200));

      try {
        const caseJson = JSON.parse(jsonText);
        const validated = ClinicalCaseSchema.parse(caseJson);
        generatedCase = validated;
        console.log('Case validated successfully');
      } catch (validationError) {
        console.error('Validation error:', validationError);
        console.error('Failed JSON text (first 500 chars):', jsonText.substring(0, 500));
        if (attempts < maxAttempts) {
          console.log('Retrying with fix instructions...');
          // For retry, add validation error details to prompt
        } else {
          throw new Error(`Failed to generate valid case after ${maxAttempts} attempts`);
        }
      }
    }

    // Store in database (implement when Supabase is connected)
    // const { data: caseData, error } = await supabase
    //   .from('cases')
    //   .insert({
    //     slug: generatedCase.slug,
    //     title: generatedCase.title,
    //     subject: generatedCase.subject,
    //     difficulty: params.difficulty,
    //     clinical_json: generatedCase,
    //     created_by: params.faculty_id,
    //     status: 'pending',
    //     cbdc_tags: {
    //       competencyIds: generatedCase.competencyIds,
    //       sloIds: generatedCase.sloIds,
    //       millerLevel: generatedCase.millerLevel,
    //       bloomDomain: generatedCase.bloomDomain,
    //     }
    //   })
    //   .select()
    //   .single();

    if (!generatedCase) {
      throw new Error('Failed to generate valid case');
    }

    // Generate transient preview overview (NOT stored in DB)
    const previewText = generatePreviewOverview(generatedCase);

    return new Response(
      JSON.stringify({
        success: true,
        case: generatedCase,
        previewText: previewText,
        rawModelOutputId: `model-out-${Date.now()}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate_case:', error);
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
