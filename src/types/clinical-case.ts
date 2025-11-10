import { z } from "zod";

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

// Rubric item schema
export const RubricItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  weight: z.number(),
  competencyIds: z.array(z.string()).optional(),
  sloIds: z.array(z.string()).optional(),
});

// Rubric section schema
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

// Main Clinical Case schema
export const ClinicalCaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  subject: z.string(),
  competencyIds: z.array(z.string()),
  sloIds: z.array(z.string()),
  millerLevel: z.enum(["Knows", "KnowsHow", "ShowsHow", "Does"]),
  bloomDomain: z.string(),
  durationMinutes: z.number().positive(),
  patient: PatientSchema,
  stem: z.string(),
  vitals: z.record(z.string(), z.union([z.string(), z.number()])),
  script: ScriptSchema,
  rubric: z.array(RubricSectionSchema),
  mcqs: z.array(MCQSchema),
  metadata: MetadataSchema,
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
  millerLevel: z.enum(["Knows", "KnowsHow", "ShowsHow", "Does"]),
  bloomDomain: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  durationMinutes: z.number().positive(),
  ayurvedicContext: z.object({
    doshaFocus: z.array(z.enum(["Vata", "Pitta", "Kapha"])).optional(),
    specialModality: z.string().optional(),
  }).optional(),
});

export type GenerateCaseParams = z.infer<typeof GenerateCaseParamsSchema>;
