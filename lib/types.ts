// ─── Sub-question ────────────────────────────────────────────────────────────
export type ActionWord =
  | 'Find' | 'Solve' | 'Write' | 'Graph' | 'Calculate'
  | 'Determine' | 'State' | 'Show' | 'Justify' | 'Classify'
  | 'Define' | 'Explain';

export type CognitiveLevel = 1 | 2 | 3;

export type WorkingSpace = 'short' | 'procedural' | 'extended';

export interface SubQuestion {
  id: string;
  actionWord: ActionWord;
  prompt: string;          // plain text; AI will wrap action word in \Find etc.
  level: CognitiveLevel;
  marks: number;
  workingSpace: WorkingSpace;
  diagramHint: string;     // e.g. "right triangle, legs sqrt3 and sqrt6, yellow fill"
  continuesOnNextPage: boolean;
}

// ─── Question ─────────────────────────────────────────────────────────────────
export type QuestionType =
  | 'inequality'
  | 'geometry'
  | 'special-triangles'
  | 'system-equations'
  | 'system-inequalities'
  | 'word-problem'
  | 'other';

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  topic: string;           // e.g. "Compound Inequalities"
  stem: string;            // the main question text before sub-parts
  subQuestions: SubQuestion[];
}

// ─── Assessment header ────────────────────────────────────────────────────────
export type CourseLevel = 'Math 9 Extended' | 'Math 9 Standard';

export interface AssessmentMeta {
  course: CourseLevel;
  block: string;           // e.g. "4"
  assessmentNumber: number;
  monthYear: string;       // e.g. "May 2025"
  durationMinutes: number;
  gdcRequired: boolean;
}

// ─── Full assessment ──────────────────────────────────────────────────────────
export interface Assessment {
  id: string;
  meta: AssessmentMeta;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  // computed
  totalMarks: number;
}

// ─── Library entry (lightweight, for list views) ─────────────────────────────
export interface AssessmentSummary {
  id: string;
  title: string;           // "Math 9 Extended Block 4 — KA #2"
  course: CourseLevel;
  assessmentNumber: number;
  totalMarks: number;
  questionCount: number;
  updatedAt: string;
}
