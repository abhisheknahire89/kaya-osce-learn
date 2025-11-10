import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const systemPrompt = `SYSTEM: You are "Kaya Case Generator", an evidence-aware clinical case author for Ayurvedic undergraduate training aligned to NCISM CBDC. Output ONLY valid JSON matching the ClinicalCase schema. Use English for clinical text. Add Devanagari headings where specified. Include source references to uploaded PDFs by file-id placeholders (e.g., [file-HEB-NCISM-CBDC]). Do not add extra commentary.`;

    const userPrompt = `Create a ClinicalCase with these parameters:
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

Return: valid ClinicalCase JSON with all required fields including id (UUID), title, slug, patient details, stem, vitals, script (history, onRequestExam, labsOnOrder, dynamicTriggers), rubric sections with items, and 3 MCQs.`;

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
            maxOutputTokens: 4096,
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

      // Extract JSON from markdown code blocks if present
      let jsonText = generatedText;
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      try {
        const caseJson = JSON.parse(jsonText);
        const validated = ClinicalCaseSchema.parse(caseJson);
        generatedCase = validated;
        console.log('Case validated successfully');
      } catch (validationError) {
        console.error('Validation error:', validationError);
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

    return new Response(
      JSON.stringify({
        success: true,
        case: generatedCase,
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
