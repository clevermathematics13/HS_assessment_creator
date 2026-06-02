import type { Assessment, AssessmentMeta, Question, SubQuestion, AssessmentSummary } from './types';

export function computeTotalMarks(questions: Question[]): number {
  return questions.reduce((sum, q) =>
    sum + q.subQuestions.reduce((s, sq) => s + sq.marks, 0), 0);
}

export function makeAssessmentTitle(meta: AssessmentMeta): string {
  return `${meta.course} Block ${meta.block} — KA #${meta.assessmentNumber}`;
}

export function toSummary(a: Assessment): AssessmentSummary {
  return {
    id: a.id,
    title: makeAssessmentTitle(a.meta),
    course: a.meta.course,
    assessmentNumber: a.meta.assessmentNumber,
    totalMarks: a.totalMarks,
    questionCount: a.questions.length,
    updatedAt: a.updatedAt,
  };
}

export function newSubQuestion(): SubQuestion {
  return {
    id: crypto.randomUUID(),
    actionWord: 'Find',
    prompt: '',
    level: 2,
    marks: 2,
    workingSpace: 'procedural',
    diagramHint: '',
    continuesOnNextPage: false,
  };
}

export function newQuestion(number: number): Question {
  return {
    id: crypto.randomUUID(),
    number,
    type: 'other',
    topic: '',
    stem: '',
    subQuestions: [newSubQuestion()],
  };
}

export function newAssessment(): Assessment {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    meta: {
      course: 'Math 9 Extended',
      block: '',
      assessmentNumber: 1,
      monthYear: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      durationMinutes: 50,
      gdcRequired: true,
    },
    questions: [newQuestion(1)],
    createdAt: now,
    updatedAt: now,
    totalMarks: 0,
  };
}
