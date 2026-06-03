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
  prompt: string;
  level: CognitiveLevel;
  marks: number;
  workingSpace: WorkingSpace;
  diagramHint: string;
  continuesOnNextPage: boolean;
}

// ─── Question ────────────────────────────────────────────────────────────────
export type QuestionType =
  | 'inequality' | 'geometry' | 'special-triangles'
  | 'system-equations' | 'system-inequalities'
  | 'word-problem' | 'other';

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  topic: string;
  stem: string;
  subQuestions: SubQuestion[];
}

// ─── Assessment header ───────────────────────────────────────────────────────
export type CourseLevel = 'Math 9 Extended' | 'Math 9 Standard';

export interface AssessmentMeta {
  course: CourseLevel;
  block: string;
  assessmentNumber: number;
  monthYear: string;
  durationMinutes: number;
  gdcRequired: boolean;
}

// ─── Full assessment ─────────────────────────────────────────────────────────
export interface Assessment {
  id: string;
  meta: AssessmentMeta;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  totalMarks: number;
}

// ─── Library entry ───────────────────────────────────────────────────────────
export interface AssessmentSummary {
  id: string;
  title: string;
  course: CourseLevel;
  assessmentNumber: number;
  totalMarks: number;
  questionCount: number;
  updatedAt: string;
}

// ─── File repository ─────────────────────────────────────────────────────────
export type RepoFileType = 'pdf' | 'docx' | 'md' | 'txt' | 'tex' | 'google';

export interface RepoFile {
  id: string;
  name: string;          // display name
  type: RepoFileType;
  source: 'upload' | 'google'; // how it was added
  googleUrl?: string;    // original Google URL if source === 'google'
  extractedText: string; // full plain-text content for Claude
  sizeChars: number;     // char count of extractedText
  createdAt: string;
  updatedAt: string;
}

export interface RepoFileSummary {
  id: string;
  name: string;
  type: RepoFileType;
  source: 'upload' | 'google';
  sizeChars: number;
  createdAt: string;
}
