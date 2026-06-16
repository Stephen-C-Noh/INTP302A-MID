// Shared shape and AI contract for a Study Note (see CONTEXT.md / proposal.md).

export type KeyConcept = {
  term: string;
  definition: string;
};

export type StudyNote = {
  title: string;
  course: string;
  summary: string;
  keyConcepts: KeyConcept[];
  questions: string[];
};

// JSON schema enforced via the model's structured-output mode (strict).
export const studyNoteJsonSchema = {
  name: "study_note",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      course: { type: "string" },
      summary: { type: "string" },
      keyConcepts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            term: { type: "string" },
            definition: { type: "string" },
          },
          required: ["term", "definition"],
        },
      },
      questions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["title", "course", "summary", "keyConcepts", "questions"],
  },
} as const;

export const MAX_MATERIAL_CHARS = 10_000;

export const SYSTEM_PROMPT = `You are a study assistant. Given a learner's raw course notes ("Study Material"), produce one structured study note.

Rules:
- ALWAYS write every field in English, regardless of the input language. Translate if needed.
- title: a short, descriptive title for the note.
- course: if a course/subject is provided, echo it; otherwise infer the most likely course name from the material.
- summary: ONE concise paragraph (3-5 sentences) capturing the core ideas.
- keyConcepts: the important ideas, each as a term plus a one-line definition.
- questions: 2-3 open-ended reflection questions that provoke thinking. Do NOT provide answers; they are food for thought, not a quiz.
- Base everything strictly on the provided Study Material. Do not invent facts.`;

export function buildUserPrompt(material: string, course?: string): string {
  const courseLine = course?.trim()
    ? `Course (provided by user): ${course.trim()}\n\n`
    : "";
  return `${courseLine}Study Material:\n${material.trim()}`;
}
