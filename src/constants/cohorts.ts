// Hardcoded cohorts for the application
export const COHORTS = [
  { id: "3rd-year", name: "3rd year" },
  { id: "4th-year", name: "4th year" },
  { id: "intern", name: "Intern" },
] as const;

export type CohortId = typeof COHORTS[number]['id'];
