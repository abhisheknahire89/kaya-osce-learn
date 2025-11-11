import referencesData from "@/data/clinical-references.json";

export interface ClinicalReference {
  id: string;
  title: string;
  type: string;
  authors: string;
  publisher?: string;
  location?: string;
  topics: string[];
}

export const clinicalReferences: ClinicalReference[] = referencesData.references;

/**
 * Get a random reference from the collection
 */
export function getRandomReference(): ClinicalReference {
  const randomIndex = Math.floor(Math.random() * clinicalReferences.length);
  return clinicalReferences[randomIndex];
}

/**
 * Get references by topic
 */
export function getReferencesByTopic(topic: string): ClinicalReference[] {
  return clinicalReferences.filter((ref) =>
    ref.topics.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
  );
}

/**
 * Get a formatted citation string for a reference
 */
export function formatCitation(ref: ClinicalReference): string {
  let citation = `${ref.title} by ${ref.authors}`;
  if (ref.publisher) {
    citation += `, ${ref.publisher}`;
  }
  if (ref.location) {
    citation += `, ${ref.location}`;
  }
  return citation;
}

/**
 * Get reference for a specific clinical topic
 */
export function getReferenceForTopic(topic: string): string {
  const topicMap: { [key: string]: string[] } = {
    history: ["dravyaguna", "classical_text"],
    examination: ["pharmacology", "diagnosis"],
    diagnosis: ["clinical_reasoning", "diagnosis"],
    management: ["pharmacology", "therapeutics"],
    communication: ["clinical_practice"],
    agni: ["digestion", "metabolism"],
    dosha: ["tridosha", "classical_text"],
    lab_tests: ["modern_medicine", "diagnostics"],
    immediate_care: ["emergency", "management"],
  };

  const topics = topicMap[topic.toLowerCase()] || ["dravyaguna"];
  const references = topics.flatMap((t) => getReferencesByTopic(t));

  if (references.length > 0) {
    const ref = references[Math.floor(Math.random() * references.length)];
    return formatCitation(ref);
  }

  return formatCitation(getRandomReference());
}

/**
 * Get a specific reference by common clinical areas
 */
export function getCitationForArea(area: string): string {
  const areaToTopicMap: { [key: string]: string } = {
    "Agni/appetite": "digestion",
    "Bowel movements": "digestion",
    "Dosha assessment": "tridosha",
    "Pulse diagnosis": "diagnosis",
    "Lab ordering": "modern_medicine",
    "Immediate management": "emergency",
    "Cooling measures": "therapeutics",
    "ORS/hydration": "emergency",
    "Pittaja Jwara": "classical_text",
    "Clinical reasoning": "diagnosis",
  };

  const topic = areaToTopicMap[area] || "dravyaguna";
  return getReferenceForTopic(topic);
}
