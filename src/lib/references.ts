import referencesData from "@/data/references.json";

interface Reference {
  id: string;
  title: string;
  category: string;
  authors: string[];
  year: string;
  publisher: string;
  chapters?: Record<string, string>;
  file_id: string;
  available: boolean;
  translators?: string[];
  volumes?: number;
  edition?: string;
}

interface CitationFormat {
  standard: string;
  short: string;
  audit: string;
}

interface ReferencesData {
  references: Reference[];
  citation_format: CitationFormat;
}

const references = referencesData as ReferencesData;

/**
 * Get a reference by ID
 */
export const getReferenceById = (id: string): Reference | undefined => {
  return references.references.find((ref) => ref.id === id);
};

/**
 * Format a citation in different styles
 */
export const formatCitation = (
  referenceId: string,
  format: "standard" | "short" | "audit" = "short",
  chapterKey?: string
): string => {
  const ref = getReferenceById(referenceId);
  if (!ref) {
    return `[Reference ${referenceId} not found]`;
  }

  const authorsStr = ref.authors.join(", ");
  const chapterStr = chapterKey && ref.chapters?.[chapterKey] 
    ? ref.chapters[chapterKey] 
    : "";

  let template = references.citation_format[format];

  // Replace placeholders
  template = template.replace("{id}", ref.id);
  template = template.replace("{authors}", authorsStr);
  template = template.replace("{year}", ref.year);
  template = template.replace("{title}", ref.title);
  template = template.replace("{publisher}", ref.publisher);
  template = template.replace("{chapter}", chapterStr);
  template = template.replace("{file_id}", ref.file_id);

  return template;
};

/**
 * Get all references by category
 */
export const getReferencesByCategory = (category: string): Reference[] => {
  return references.references.filter((ref) => ref.category === category);
};

/**
 * Search references by keyword
 */
export const searchReferences = (keyword: string): Reference[] => {
  const lowerKeyword = keyword.toLowerCase();
  return references.references.filter(
    (ref) =>
      ref.title.toLowerCase().includes(lowerKeyword) ||
      ref.authors.some((author) => author.toLowerCase().includes(lowerKeyword)) ||
      ref.category.toLowerCase().includes(lowerKeyword)
  );
};

/**
 * Get citation for rubric item
 * Maps common terms to appropriate references
 */
export const getCitationForTopic = (topic: string): string => {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("agni") || topicLower.includes("appetite")) {
    return formatCitation("CHARAKA-SAMHITA", "short", "vimana_sthana");
  }
  
  if (topicLower.includes("nadi") || topicLower.includes("pulse")) {
    return formatCitation("NADI-VIJNANA", "short", "clinical");
  }
  
  if (topicLower.includes("jwara") || topicLower.includes("fever")) {
    return formatCitation("KAYACHIKITSA-TEXTBOOK", "short", "jwara");
  }
  
  if (topicLower.includes("socrates") || topicLower.includes("history")) {
    return formatCitation("CLINICAL-METHODS", "short", "history");
  }
  
  if (topicLower.includes("physical exam") || topicLower.includes("examination")) {
    return formatCitation("CLINICAL-METHODS", "short", "examination");
  }
  
  if (topicLower.includes("diagnosis") || topicLower.includes("differential")) {
    return formatCitation("CLINICAL-METHODS", "short", "diagnostics");
  }
  
  if (topicLower.includes("competency") || topicLower.includes("cbdc")) {
    return formatCitation("HEB-NCH-CBDC", "short", "kayachikitsa");
  }
  
  if (topicLower.includes("osce") || topicLower.includes("assessment")) {
    return formatCitation("VOSCE-GUIDELINES", "short", "rubrics");
  }

  // Default fallback
  return formatCitation("HEB-NCH-CBDC", "short", "kayachikitsa");
};

/**
 * Generate bibliography for a case
 */
export const generateBibliography = (referenceIds: string[]): string[] => {
  return referenceIds
    .map((id) => formatCitation(id, "standard"))
    .filter((citation) => !citation.includes("not found"));
};

export { references };
export type { Reference, CitationFormat };
