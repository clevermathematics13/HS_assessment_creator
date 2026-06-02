'use client';

import { useCallback } from 'react';
import type { Assessment, Question, SubQuestion, CourseLevel, QuestionType, ActionWord, CognitiveLevel, WorkingSpace } from '@/lib/types';
import { newQuestion, newSubQuestion, computeTotalMarks } from '@/lib/assessment-utils';

interface Props {
  assessment: Assessment;
  onChange: (a: Assessment) => void;
  onSaved: () => void;
}

const COURSES: CourseLevel[] = ['Math 9 Extended', 'Math 9 Standard'];
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'inequality',         label: 'Inequalities' },
  { value: 'geometry',           label: 'Geometry / Angles' },
  { value: 'special-triangles',  label: 'Special Right Triangles' },
  { value: 'system-equations',   label: 'Systems of Equations' },
  { value: 'system-inequalities',label: 'Systems of Inequalities' },
  { value: 'word-problem',       label: 'Word Problem / Modeling' },
  { value: 'other',              label: 'Other' },
];
const ACTION_WORDS: ActionWord[] = [
  'Find','Solve','Write','Graph','Calculate','Determine','State','Show','Justify','Classify','Define','Explain',
];
const WORKING_SPACES: { value: WorkingSpace; label: string; hint: string }[] = [
  { value: 'short',       label: 'Short',      hint: '~3 cm' },
  { value: 'procedural',  label: 'Procedural', hint: '~5 cm' },
  { value: 'extended',    label: 'Extended',   hint: '~7 cm' },
];

// ─── tiny helpers ────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-[#13131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[rgb(0,102,204)] transition-colors';
const labelCls = 'block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1';

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
        active
          ? 'border-[rgb(0,102,204)] bg-[rgb(0,102,204)]/20 text-blue-300'
          : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
      }`}
    >
      {label}
    </button>
  );
}

function LevelBadge({ level, onClick }: { level: CognitiveLevel; onClick: () => void }) {
  const colors: Record<CognitiveLevel, string> = {
    1: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    2: 'bg-amber-900/40  text-amber-400  border-amber-800',
    3: 'bg-rose-900/40   text-rose-400   border-rose-800',
  };
  const labels: Record<CognitiveLevel, string> = { 1: 'L1 Recall', 2: 'L2 Apply', 3: 'L3 Analyze' };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all hover:opacity-80 ${colors[level]}`}
    >
      {labels[level]}
    </button>
  );
}

// ─── SubQuestion editor ───────────────────────────────────────────────────────
function SubQuestionEditor({
  sq, letter, onUpdate, onRemove, canRemove,
}: {
  sq: SubQuestion;
  letter: string;
  onUpdate: (patch: Partial<SubQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const cycleLevel = () => {
    const next: Record<CognitiveLevel, CognitiveLevel> = { 1: 2, 2: 3, 3: 1 };
    onUpdate({ level: next[sq.level] });
  };

  return (
    <div className="rounded-xl border border-white/8 bg-[#0f0f16] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: 'rgb(0,102,204)' }}>
          {letter}.
        </span>
        <div className="flex items-center gap-2">
          <LevelBadge level={sq.level} onClick={cycleLevel} />
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-gray-600 hover:text-rose-400 text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Action word */}
      <div>
        <span className={labelCls}>Action word</span>
        <div className="flex flex-wrap gap-1.5">
          {ACTION_WORDS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => onUpdate({ actionWord: w })}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all border ${
                sq.actionWord === w
                  ? 'border-[rgb(204,0,0)] bg-[rgb(204,0,0)]/20 text-red-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <span className={labelCls}>Prompt</span>
        <textarea
          value={sq.prompt}
          onChange={e => onUpdate({ prompt: e.target.value })}
          rows={2}
          placeholder={`${sq.actionWord} the value of ...`}
          className={inputCls + ' resize-none font-mono text-xs'}
        />
      </div>

      {/* Working space + marks */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>Working space</span>
          <div className="flex gap-1.5">
            {WORKING_SPACES.map(ws => (
              <Pill
                key={ws.value}
                label={`${ws.label} ${ws.hint}`}
                active={sq.workingSpace === ws.value}
                onClick={() => onUpdate({ workingSpace: ws.value })}
              />
            ))}
          </div>
        </div>
        <div>
          <span className={labelCls}>Marks</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ marks: Math.max(1, sq.marks - 1) })}
              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold"
            >−</button>
            <span className="text-sm font-bold text-white w-4 text-center">{sq.marks}</span>
            <button
              type="button"
              onClick={() => onUpdate({ marks: Math.min(12, sq.marks + 1) })}
              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold"
            >+</button>
          </div>
        </div>
      </div>

      {/* Diagram hint */}
      <div>
        <span className={labelCls}>Diagram hint <span className="normal-case font-normal text-gray-600">(optional — describes TikZ figure)</span></span>
        <input
          type="text"
          value={sq.diagramHint}
          onChange={e => onUpdate({ diagramHint: e.target.value })}
          placeholder="e.g. right triangle, legs √3 and √6, yellow fill, right angle at C"
          className={inputCls + ' text-xs'}
        />
      </div>

      {/* Continues on next page */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={sq.continuesOnNextPage}
          onChange={e => onUpdate({ continuesOnNextPage: e.target.checked })}
          className="w-3.5 h-3.5 accent-blue-500"
        />
        <span className="text-xs text-gray-500">Continues onto next page</span>
      </label>
    </div>
  );
}

// ─── Question editor ──────────────────────────────────────────────────────────
function QuestionEditor({
  q, onUpdate, onRemove, canRemove,
}: {
  q: Question;
  onUpdate: (patch: Partial<Question>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const updateSQ = (idx: number, patch: Partial<SubQuestion>) => {
    const sqs = q.subQuestions.map((sq, i) => i === idx ? { ...sq, ...patch } : sq);
    onUpdate({ subQuestions: sqs });
  };
  const addSQ = () => onUpdate({ subQuestions: [...q.subQuestions, newSubQuestion()] });
  const removeSQ = (idx: number) => {
    onUpdate({ subQuestions: q.subQuestions.filter((_, i) => i !== idx) });
  };

  const totalMark = q.subQuestions.reduce((s, sq) => s + sq.marks, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden">
      {/* Question header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'rgb(204,85,0)' }}
          >
            {q.number}
          </span>
          <span className="text-xs font-semibold text-gray-300">
            {q.topic || 'Untitled question'}
          </span>
          <span className="text-[10px] text-gray-600">
            {totalMark} mark{totalMark !== 1 ? 's' : ''}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-600 hover:text-rose-400 transition-colors px-2 py-1"
          >
            Remove question
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Topic + type row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>Topic / title</span>
            <input
              type="text"
              value={q.topic}
              onChange={e => onUpdate({ topic: e.target.value })}
              placeholder="e.g. Compound Inequalities"
              className={inputCls}
            />
          </div>
          <div>
            <span className={labelCls}>Question type</span>
            <select
              value={q.type}
              onChange={e => onUpdate({ type: e.target.value as QuestionType })}
              className={inputCls + ' cursor-pointer'}
            >
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stem */}
        <div>
          <span className={labelCls}>Question stem <span className="normal-case font-normal text-gray-600">(intro text before sub-parts, or leave blank)</span></span>
          <textarea
            value={q.stem}
            onChange={e => onUpdate({ stem: e.target.value })}
            rows={2}
            placeholder="e.g. Solve each inequality, writing the solution in algebraic, interval, and geometric representations."
            className={inputCls + ' resize-none text-sm'}
          />
        </div>

        {/* Sub-questions */}
        <div className="space-y-3">
          {q.subQuestions.map((sq, idx) => (
            <SubQuestionEditor
              key={sq.id}
              sq={sq}
              letter={'abcdefghij'[idx]}
              onUpdate={patch => updateSQ(idx, patch)}
              onRemove={() => removeSQ(idx)}
              canRemove={q.subQuestions.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={addSQ}
            className="w-full py-2 rounded-lg border border-dashed border-white/15 text-xs text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all"
          >
            + Add sub-question
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main BuildTab ─────────────────────────────────────────────────────────────
export default function BuildTab({ assessment, onChange, onSaved }: Props) {
  const { meta, questions } = assessment;
  const totalMarks = computeTotalMarks(questions);

  const setMeta = useCallback(<K extends keyof typeof meta>(key: K, val: typeof meta[K]) => {
    onChange({ ...assessment, meta: { ...meta, [key]: val }, updatedAt: new Date().toISOString() });
  }, [assessment, onChange, meta]);

  const updateQuestion = useCallback((idx: number, patch: Partial<Question>) => {
    const qs = questions.map((q, i) => i === idx ? { ...q, ...patch } : q);
    onChange({ ...assessment, questions: qs, totalMarks: computeTotalMarks(qs), updatedAt: new Date().toISOString() });
  }, [assessment, onChange, questions]);

  const addQuestion = () => {
    const qs = [...questions, newQuestion(questions.length + 1)];
    onChange({ ...assessment, questions: qs, totalMarks: computeTotalMarks(qs), updatedAt: new Date().toISOString() });
  };

  const removeQuestion = (idx: number) => {
    const qs = questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, number: i + 1 }));
    onChange({ ...assessment, questions: qs, totalMarks: computeTotalMarks(qs), updatedAt: new Date().toISOString() });
  };

  const handleSave = async () => {
    try {
      const body = { ...assessment, totalMarks };
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left: meta panel ── */}
      <aside className="w-72 shrink-0 border-r border-white/8 p-5 overflow-y-auto space-y-5">
        <div>
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Assessment Info</h2>

          <div className="space-y-3">
            <div>
              <span className={labelCls}>Course</span>
              <div className="space-y-1.5">
                {COURSES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMeta('course', c)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      meta.course === c
                        ? 'border-[rgb(0,102,204)] bg-[rgb(0,102,204)]/15 text-blue-300'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={labelCls}>Block</span>
                <input
                  type="text"
                  value={meta.block}
                  onChange={e => setMeta('block', e.target.value)}
                  placeholder="e.g. 4"
                  className={inputCls}
                />
              </div>
              <div>
                <span className={labelCls}>KA #</span>
                <input
                  type="number"
                  value={meta.assessmentNumber}
                  min={1}
                  onChange={e => setMeta('assessmentNumber', Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Month & Year</span>
              <input
                type="text"
                value={meta.monthYear}
                onChange={e => setMeta('monthYear', e.target.value)}
                placeholder="e.g. May 2025"
                className={inputCls}
              />
            </div>

            <div>
              <span className={labelCls}>Duration (minutes)</span>
              <input
                type="number"
                value={meta.durationMinutes}
                min={10}
                max={180}
                onChange={e => setMeta('durationMinutes', Number(e.target.value))}
                className={inputCls}
              />
            </div>

            <div>
              <span className={labelCls}>Calculator</span>
              <div className="flex gap-2">
                {([true, false] as const).map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setMeta('gdcRequired', v)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      meta.gdcRequired === v
                        ? 'border-[rgb(204,85,0)] bg-[rgb(204,85,0)]/15 text-orange-300'
                        : 'border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {v ? 'GDC Required' : 'No GDC'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Totals summary */}
        <div className="rounded-xl border border-white/8 p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Questions</span>
            <span className="font-semibold text-gray-200">{questions.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total marks</span>
            <span className="font-black" style={{ color: 'rgb(204,85,0)' }}>{totalMarks}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Sub-questions</span>
            <span className="font-semibold text-gray-200">
              {questions.reduce((s, q) => s + q.subQuestions.length, 0)}
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'rgb(0,102,204)' }}
        >
          Save to Library
        </button>
      </aside>

      {/* ── Right: question editors ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-200">Questions</h2>
          <span className="text-xs text-gray-600">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} marks total
          </span>
        </div>

        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            q={q}
            onUpdate={patch => updateQuestion(idx, patch)}
            onRemove={() => removeQuestion(idx)}
            canRemove={questions.length > 1}
          />
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-white/10 text-sm text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all"
        >
          + Add question
        </button>
      </div>
    </div>
  );
}
