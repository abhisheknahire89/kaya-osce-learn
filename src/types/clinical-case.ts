import { z } from "zod";

// NCISM Competency Domains
export const NCISMDomainSchema = z.enum([
  "History",
  "Examination", 
  "Diagnosis",
  "Management",
  "Communication",
  "Procedural",
  "Resource Stewardship"
]);

export type NCISMDomain = z.infer<typeof NCISMDomainSchema>;

// Miller's Pyramid Levels
export const MillerLevelSchema = z.enum(["Knows", "KnowsHow", "ShowsHow", "Does"]);

export type MillerLevel = z.infer<typeof MillerLevelSchema>;

// 3-Level Scoring Criteria (NCISM-aligned)
export const ScoringCriteriaSchema = z.object({
  score0: z.string().describe("Not demonstrated - criterion absent or incorrect"),
  score1: z.string().describe("Partially demonstrated - implicit understanding or incomplete"),
  score2: z.string().describe("Fully demonstrated - explicit, correct, and complete"),
});

export type ScoringCriteria = z.infer<typeof ScoringCriteriaSchema>;

// Patient schema
export const PatientSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(["M", "F", "Other"]),
  language_preference: z.string().default("English"),
});

// Script schema for virtual patient interactions
export const ScriptSchema = z.object({
  history: z.record(z.string(), z.string()),
  onRequestExam: z.record(z.string(), z.string()),
  labsOnOrder: z.record(z.string(), z.string()),
  dynamicTriggers: z.record(z.string(), z.array(z.string())).optional(),
});

// Enhanced Rubric Item Schema (NCISM-aligned with 3-level scoring)
export const EnhancedRubricItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  millerLevel: MillerLevelSchema,
  ncismDomain: NCISMDomainSchema,
  ncismCompetencyCode: z.string().optional().describe("e.g., KC.UG.4.1"),
  maxMarks: z.number().default(2).describe("Standardized to 2 for 0/1/2 scoring"),
  scoringCriteria: ScoringCriteriaSchema.optional(),
  implicitReasoningCues: z.array(z.string()).optional().describe("Keywords that earn partial credit"),
  examinerNotes: z.string().optional(),
  notApplicable: z.boolean().default(false),
  childAppropriate: z.boolean().default(false).describe("For Kaumarabhritya cases"),
  competencyIds: z.array(z.string()).optional(),
  sloIds: z.array(z.string()).optional(),
  // Legacy fields for backward compatibility
  weight: z.number().optional(),
  tip: z.string().optional(),
  reference: z.string().optional(),
});

export type EnhancedRubricItem = z.infer<typeof EnhancedRubricItemSchema>;

// Legacy Rubric Item Schema (for backward compatibility)
export const RubricItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  weight: z.number(),
  competencyIds: z.array(z.string()).optional(),
  sloIds: z.array(z.string()).optional(),
  // New optional fields
  millerLevel: MillerLevelSchema.optional(),
  ncismDomain: NCISMDomainSchema.optional(),
  ncismCompetencyCode: z.string().optional(),
  maxMarks: z.number().optional(),
  scoringCriteria: ScoringCriteriaSchema.optional(),
  implicitReasoningCues: z.array(z.string()).optional(),
  examinerNotes: z.string().optional(),
  notApplicable: z.boolean().optional(),
  childAppropriate: z.boolean().optional(),
  tip: z.string().optional(),
  reference: z.string().optional(),
});

// Enhanced Rubric Section Schema
export const EnhancedRubricSectionSchema = z.object({
  section: z.string(),
  max: z.number(),
  ncismDomain: NCISMDomainSchema.optional(),
  millerLevel: MillerLevelSchema.optional(),
  ncismCompetencyCode: z.string().optional(),
  items: z.array(EnhancedRubricItemSchema),
});

export type EnhancedRubricSection = z.infer<typeof EnhancedRubricSectionSchema>;

// Legacy Rubric Section Schema (for backward compatibility)
export const RubricSectionSchema = z.object({
  section: z.string(),
  max: z.number(),
  items: z.array(RubricItemSchema),
});

// MCQ schema
export const MCQSchema = z.object({
  id: z.string(),
  stem: z.string(),
  choices: z.array(z.string()),
  correctIndex: z.number(),
  rationale: z.string(),
  sloId: z.string(),
});

// Metadata schema
export const MetadataSchema = z.object({
  sourcePdfId: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
});

// Global Rating Scale (NCISM-aligned)
export const GlobalRatingSchema = z.enum([
  "NotReady",
  "Borderline", 
  "Competent",
  "Excellent"
]);

export type GlobalRating = z.infer<typeof GlobalRatingSchema>;

// Grade Bands (NCISM-aligned)
export const GradeBandSchema = z.object({
  minPercent: z.number(),
  maxPercent: z.number(),
  label: z.string(),
  description: z.string(),
  globalRating: GlobalRatingSchema,
});

export const NCISM_GRADE_BANDS: z.infer<typeof GradeBandSchema>[] = [
  {
    minPercent: 70,
    maxPercent: 100,
    label: "PASS (Competent)",
    description: "Meets expected competency for year level",
    globalRating: "Competent",
  },
  {
    minPercent: 60,
    maxPercent: 69,
    label: "BORDERLINE (Needs Remediation)",
    description: "Demonstrates potential but requires targeted practice before re-assessment",
    globalRating: "Borderline",
  },
  {
    minPercent: 0,
    maxPercent: 59,
    label: "NOT YET COMPETENT",
    description: "Requires structured remediation program and faculty-supervised re-attempt",
    globalRating: "NotReady",
  },
];

// Score Result Schema (NCISM-aligned)
export const ScoreResultSchema = z.object({
  itemId: z.string(),
  score: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal("N/A")]),
  reasoning: z.string(),
  implicitCredit: z.boolean().default(false),
  evidence: z.string().optional(),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

// Scored Section Schema
export const ScoredSectionSchema = z.object({
  section: z.string(),
  score: z.number(),
  max: z.number(),
  ncismDomain: NCISMDomainSchema.optional(),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    achieved: z.union([z.literal(0), z.literal(0.5), z.literal(1), z.literal("N/A")]),
    evidence: z.string().nullable(),
    tip: z.string().nullable(),
    reference: z.string().nullable(),
    implicitCredit: z.boolean().optional(),
  })),
});

export type ScoredSection = z.infer<typeof ScoredSectionSchema>;

// Main Clinical Case schema
export const ClinicalCaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  subject: z.string(),
  competencyIds: z.array(z.string()),
  sloIds: z.array(z.string()),
  millerLevel: MillerLevelSchema,
  bloomDomain: z.string(),
  durationMinutes: z.number().positive(),
  patient: PatientSchema,
  stem: z.string(),
  vitals: z.record(z.string(), z.union([z.string(), z.number()])),
  script: ScriptSchema,
  rubric: z.array(RubricSectionSchema),
  mcqs: z.array(MCQSchema),
  metadata: MetadataSchema,
  // New NCISM-specific fields
  targetYear: z.enum(["3rd Year", "4th Year", "Internship"]).optional(),
  passingCriteria: z.number().default(70).describe("Minimum percentage to pass"),
  childAppropriate: z.boolean().optional().describe("Kaumarabhritya case flag"),
});

// Export types
export type Patient = z.infer<typeof PatientSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type RubricItem = z.infer<typeof RubricItemSchema>;
export type RubricSection = z.infer<typeof RubricSectionSchema>;
export type MCQ = z.infer<typeof MCQSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type ClinicalCase = z.infer<typeof ClinicalCaseSchema>;

// Generation parameters schema
export const GenerateCaseParamsSchema = z.object({
  subject: z.string(),
  sloIds: z.array(z.string()),
  millerLevel: MillerLevelSchema,
  bloomDomain: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  durationMinutes: z.number().positive(),
  ayurvedicContext: z.object({
    doshaFocus: z.array(z.enum(["Vata", "Pitta", "Kapha"])).optional(),
    specialModality: z.string().optional(),
  }).optional(),
  // New NCISM-specific generation params
  targetYear: z.enum(["3rd Year", "4th Year", "Internship"]).optional(),
  childAppropriate: z.boolean().optional(),
  ncismDomainFocus: z.array(NCISMDomainSchema).optional(),
});

export type GenerateCaseParams = z.infer<typeof GenerateCaseParamsSchema>;

// Helper functions for NCISM grading
export function getGradeBand(percentage: number): typeof NCISM_GRADE_BANDS[0] {
  for (const band of NCISM_GRADE_BANDS) {
    if (percentage >= band.minPercent && percentage <= band.maxPercent) {
      return band;
    }
  }
  return NCISM_GRADE_BANDS[NCISM_GRADE_BANDS.length - 1]; // Default to lowest
}

export function getGlobalRating(percentage: number): GlobalRating {
  if (percentage >= 85) return "Excellent";
  if (percentage >= 70) return "Competent";
  if (percentage >= 60) return "Borderline";
  return "NotReady";
}

// Convert legacy binary score to 3-level score
export function convertBinaryToThreeLevel(achieved: number | boolean): 0 | 1 | 2 {
  if (typeof achieved === "boolean") {
    return achieved ? 2 : 0;
  }
  if (achieved >= 1) return 2;
  if (achieved >= 0.5) return 1;
  return 0;
}

// NCISM Domain labels for display
export const NCISM_DOMAIN_LABELS: Record<NCISMDomain, string> = {
  History: "History Taking (Rogi Pariksha - Prashna)",
  Examination: "Physical Examination (Sparsha Pariksha)",
  Diagnosis: "Clinical Diagnosis (Nidana)",
  Management: "Treatment Planning (Chikitsa)",
  Communication: "Patient Communication (Samvada)",
  Procedural: "Clinical Procedures (Kriya)",
  "Resource Stewardship": "Clinical Resource Stewardship",
};

// Miller's Level labels for display
export const MILLER_LEVEL_LABELS: Record<MillerLevel, string> = {
  Knows: "Knows (Knowledge)",
  KnowsHow: "Knows How (Competence)",
  ShowsHow: "Shows How (Performance)",
  Does: "Does (Action)",
};
