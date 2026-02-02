
# NCISM-Aligned Competency-Based OSCE Rubric Redesign

## Executive Summary

This plan redesigns Kaya's OSCE evaluation rubric from a binary (0/1) scoring model to a **3-level partial credit system (0/1/2)** aligned with NCISM CBDC standards. The redesign enables implicit clinical reasoning recognition, explicit Miller's Pyramid mapping per item, and produces student-friendly formative feedback suitable for BAMS undergraduate assessment.

---

## Current State Analysis

### Existing Rubric Schema (src/types/clinical-case.ts)

```text
RubricItemSchema:
├── id: string
├── text: string
├── weight: number (typically 1-2)
├── competencyIds: string[] (optional)
└── sloIds: string[] (optional)
```

### Identified Gaps

| Issue | Current State | NCISM Requirement |
|-------|---------------|-------------------|
| Scoring Scale | Binary 0/1 | 3-level (0/1/2) with partial credit |
| Implicit Reasoning | Not recognized | Award credit for demonstrated understanding |
| Miller's Level | Case-level only | Per-item mapping required |
| NCISM Domain | Competency codes only | Full domain labels needed |
| Not Assessed | No option | Required for inapplicable items |
| Examiner Notes | Minimal tips | Structured guidance required |
| Global Rating | Absent | Holistic rating scale needed |
| Kaumarabhritya | No special handling | Child-appropriate considerations |

---

## Redesigned Schema

### Phase 1: Enhanced Rubric Item Structure

**New RubricItemSchema (TypeScript)**

```text
EnhancedRubricItemSchema:
├── id: string
├── text: string
├── millerLevel: "Knows" | "KnowsHow" | "ShowsHow" | "Does"
├── ncismDomain: "History" | "Examination" | "Diagnosis" | "Management" | "Communication" | "Procedural" | "Resource Stewardship"
├── ncismCompetencyCode: string (e.g., "KC.UG.4.1")
├── maxMarks: 2 (standardized)
├── scoringCriteria: {
│   ├── score0: string (Not demonstrated)
│   ├── score1: string (Partially demonstrated)
│   └── score2: string (Fully demonstrated)
│ }
├── implicitReasoningCues: string[] (keywords that earn partial credit)
├── examinerNotes: string
├── notApplicable: boolean (default: false)
├── childAppropriate: boolean (for Kaumarabhritya)
└── sloIds: string[]
```

### Phase 2: Domain-wise Marking Scheme Template

**Standard OSCE Domains with NCISM Mapping**

```text
┌─────────────────────────────────────────────────────────────────┐
│ DOMAIN 1: History Taking (Rogi Pariksha - Prashna)              │
├─────────────────────────────────────────────────────────────────┤
│ NCISM Competency: KC.UG.4.1 - History Taking Skills             │
│ Miller's Level: Shows How                                        │
│ Max Marks: 10                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Items (5 × 2 marks each):                                       │
│                                                                  │
│ H1: Chief complaint elicitation (Pradhana Vedana)               │
│   0 = Did not ask about primary symptoms                        │
│   1 = Asked generally but missed specific characterization      │
│   2 = Explicitly elicited onset, duration, and character        │
│   Implicit cues: "when started", "how long", "describe pain"    │
│                                                                  │
│ H2: Aggravating/relieving factors (Vridhi-Kshaya Nidana)        │
│   0 = Did not explore                                           │
│   1 = Asked about one factor OR implied understanding           │
│   2 = Systematically explored both aggravating and relieving    │
│   Implicit cues: "worse when", "better after", "triggers"       │
│                                                                  │
│ H3: Associated symptoms (Anubandha Lakshana)                    │
│   0 = Did not ask                                               │
│   1 = Asked about one system OR general "anything else"         │
│   2 = Systematically screened relevant systems                  │
│                                                                  │
│ H4: Ayurvedic history (Prakriti, Agni, Koshtha)                 │
│   0 = Did not assess                                            │
│   1 = Asked about appetite/digestion only                       │
│   2 = Assessed Agni, bowel habits, and constitutional factors   │
│   Implicit cues: "appetite", "digestion", "bowel", "sleep"      │
│                                                                  │
│ H5: Social/lifestyle context (Vihara, Achara)                   │
│   0 = Did not explore                                           │
│   1 = Asked about occupation OR diet only                       │
│   2 = Explored occupation, diet, stress, and daily routine      │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Scoring Logic Redesign (score_case/index.ts)

**New Confidence-to-Score Mapping**

```text
Current:
├── ≥75% → Full credit (weight × 1)
├── 60-74% → Partial (weight × 0.5)
└── <60% → No credit

Redesigned (3-Level Scale):
├── ≥85% → Score 2 (Fully demonstrated)
├── 65-84% → Score 1 (Partially demonstrated/implicit)
├── <65% → Score 0 (Not demonstrated)
└── "N/A" → Excluded from max score
```

**Implicit Reasoning Recognition Protocol**

```text
When evaluating rubric items, the LLM prompt will include:

"IMPLICIT REASONING CREDIT RULES:
- If student demonstrates UNDERSTANDING without using exact terminology,
  award Score 1 (Partial).
- Example: Student says 'episodic breathlessness with wheezing, worse at night'
  → Award partial credit for 'Identifies Tamaka Shwasa' even without naming it.
- Example: Student orders relevant labs without stating differential
  → Award partial credit for 'Demonstrates clinical reasoning'
- Do NOT require Sanskrit terminology for full credit.
- Prioritize CLINICAL REASONING over ROTE RECALL."
```

---

## Implementation Plan

### Database Migration Required

**New columns for cases.clinical_json.rubric items:**

```text
ALTER TYPE: Modify rubric JSON structure to include:
- millerLevel (string)
- ncismDomain (string)  
- ncismCompetencyCode (string)
- scoringCriteria (object with score0, score1, score2)
- implicitReasoningCues (string array)
- notApplicable (boolean)
- childAppropriate (boolean)
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/clinical-case.ts` | Add EnhancedRubricItemSchema with new fields |
| `supabase/functions/generate_case/index.ts` | Update prompt to generate 3-level rubrics with NCISM domains |
| `supabase/functions/score_case/index.ts` | Implement 3-level scoring, implicit reasoning, N/A handling |
| `src/pages/Debrief.tsx` | Display 0/1/2 scores with visual indicators, add global rating |
| `src/data/sample-case.json` | Update example with new rubric format |

### Phase 4: Updated LLM Scoring Prompt

**New OSCE Examiner Prompt (for score_case/index.ts)**

```text
You are an NCISM-trained OSCE examiner assessing a BAMS student using
competency-based medical education (CBME) principles.

SCORING SCALE (for each criterion):
- 2 = Fully demonstrated: Explicit, correct, and complete
- 1 = Partially demonstrated: Implicit understanding OR incomplete
- 0 = Not demonstrated: Absent or incorrect
- N/A = Not applicable to this station

IMPLICIT REASONING RULES:
- Award Score 1 if student demonstrates clinical reasoning without exact
  terminology (e.g., describes Pittaja symptoms without naming 'Pittaja Jwara')
- Award Score 1 if student's actions logically address the criterion but
  lack explicit verbalization
- Do NOT penalize for missing Sanskrit terms if concept is understood
- Prioritize CLINICAL COMPETENCE over TERMINOLOGICAL PRECISION

NCISM GRADUATE ATTRIBUTES ASSESSED:
- Clinician: History taking, examination, diagnosis
- Communicator: Patient rapport, explanation, counseling
- Leader/Manager: Resource stewardship, appropriate referrals
- Professional: Ethics, documentation, accountability
- Scholar: Evidence-based reasoning, learning orientation

For each criterion, provide:
{
  "itemId": "H1",
  "score": 0 | 1 | 2 | "N/A",
  "reasoning": "Brief justification with evidence from transcript",
  "implicitCredit": true/false (did we award partial for implicit reasoning?)
}
```

### Phase 5: Student-Facing Feedback Template

**Debrief Screen Enhancement**

```text
┌─────────────────────────────────────────────────────────────────┐
│ OSCE PERFORMANCE SUMMARY                                        │
├─────────────────────────────────────────────────────────────────┤
│ Score: 16/20 (80%) — PASS (Competent)                          │
│ Time: 8:42 / 12:00                                              │
│ Miller's Level Demonstrated: Shows How                          │
├─────────────────────────────────────────────────────────────────┤
│ DOMAIN BREAKDOWN                                                │
│                                                                  │
│ ▰▰▰▰▰▰▰▰░░ History Taking       8/10                           │
│ ▰▰▰▰▰▰░░░░ Examination          6/10                           │
│ ▰▰▰▰▰▰▰▰▰▰ Diagnosis           10/10                           │
│ ▰▰▰▰▰▰░░░░ Management           6/10                           │
├─────────────────────────────────────────────────────────────────┤
│ STRENGTHS (Auto-generated)                                      │
│ ✓ Systematic history taking with SOCRATES approach              │
│ ✓ Correctly identified Pittaja predominance                     │
│ ✓ Appropriate investigation ordering (resource stewardship)     │
├─────────────────────────────────────────────────────────────────┤
│ PARTIAL CREDIT ITEMS (You understood but didn't fully express)  │
│ ⚠ H4: Assessed Agni but didn't document Koshtha (Score: 1/2)   │
│ ⚠ E2: Performed Nadi Pariksha but didn't verbalize findings     │
├─────────────────────────────────────────────────────────────────┤
│ PRIORITY REMEDIATION (Max 3 items)                              │
│ 1. Practice verbalizing pulse findings during examination       │
│ 2. Review Koshtha assessment in Kayachikitsa textbook          │
│ 3. Complete attached MCQ on Pittaja Nadi characteristics        │
├─────────────────────────────────────────────────────────────────┤
│ GLOBAL RATING (Holistic Assessment)                             │
│ ○ Not Ready  ○ Borderline  ● Competent  ○ Excellent            │
│                                                                  │
│ "Demonstrates solid clinical reasoning with minor gaps in       │
│  documentation. Ready for supervised practice."                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 6: Grade Bands

**NCISM-Aligned Grading**

```text
┌──────────────────────────────────────────────────┐
│ GRADE BANDS (Based on total rubric percentage)   │
├──────────────────────────────────────────────────┤
│ ≥70% = PASS (Competent)                          │
│   "Meets expected competency for year level"     │
│                                                   │
│ 60-69% = BORDERLINE (Needs Remediation)          │
│   "Demonstrates potential but requires           │
│    targeted practice before re-assessment"       │
│                                                   │
│ <60% = NOT YET COMPETENT                         │
│   "Requires structured remediation program       │
│    and faculty-supervised re-attempt"            │
├──────────────────────────────────────────────────┤
│ Note: "Not Yet Competent" replaces "Fail"        │
│ Language emphasizes developmental trajectory     │
└──────────────────────────────────────────────────┘
```

---

## Kaumarabhritya (Pediatric) Considerations

**Child-Appropriate Modifications**

```text
When childAppropriate: true, the scoring system will:

1. DOSING AWARENESS
   - Award extra credit for age-appropriate dose calculations
   - Penalize if adult doses suggested without modification
   - Check for weight-based dosing considerations

2. SHODHANA AVOIDANCE
   - Award credit for recognizing when Shodhana (Panchakarma)
     is contraindicated in young children
   - Score 0 if aggressive Shodhana suggested for children <12 years

3. COMMUNICATION STYLE
   - Evaluate parent counseling (not just patient)
   - Assess child-friendly language and rapport building
   - Credit for developmentally appropriate explanations

4. EXAMINATION ADAPTATIONS
   - Recognize adapted examination techniques for children
   - Credit for distraction techniques and patient comfort
```

---

## Technical Implementation Sequence

### Week 1: Schema & Type Updates
1. Update `src/types/clinical-case.ts` with EnhancedRubricItemSchema
2. Create migration for existing cases to new format
3. Update `src/data/sample-case.json` with example

### Week 2: Case Generation Updates
4. Modify `generate_case/index.ts` prompt to produce NCISM-aligned rubrics
5. Add NCISM domain mapping to generation
6. Include implicit reasoning cues in generated rubrics

### Week 3: Scoring Engine Updates
7. Rewrite `score_case/index.ts` for 3-level scoring
8. Implement implicit reasoning recognition
9. Add N/A handling for excluded items
10. Add global rating generation

### Week 4: Frontend Updates
11. Update `Debrief.tsx` for 0/1/2 visual display
12. Add domain-wise breakdown visualization
13. Implement global rating display
14. Add "Partial Credit" section highlighting

### Week 5: Testing & Validation
15. Test with sample cases across subjects
16. Validate NCISM alignment with MEU faculty
17. Compare scores with manual faculty assessment
18. Refine implicit reasoning cues based on feedback

---

## Success Criteria

| Metric | Target |
|--------|--------|
| NCISM Domain Coverage | 100% of items mapped |
| Implicit Credit Rate | 15-25% of partial scores |
| Faculty Acceptance | 80%+ find it fair and usable |
| Student Understanding | 90%+ understand feedback |
| Inter-rater Reliability | κ ≥ 0.75 vs. human examiner |

---

## Summary

This redesign transforms Kaya's OSCE rubric from a binary checklist into an **NCISM-compliant, competency-based assessment framework** that:

1. Awards **partial credit (0/1/2)** for demonstrated understanding
2. Recognizes **implicit clinical reasoning** without requiring exact terminology
3. Maps every item to **NCISM competency domains and Miller's levels**
4. Includes **Not Applicable** handling for irrelevant items
5. Provides **child-appropriate considerations** for Kaumarabhritya
6. Generates **formative, student-friendly feedback** with priority remediation
7. Uses **developmental language** ("Not Yet Competent" vs. "Fail")

The implementation requires updates to TypeScript schemas, AI generation prompts, scoring logic, and frontend display—all achievable within a 5-week development cycle.
