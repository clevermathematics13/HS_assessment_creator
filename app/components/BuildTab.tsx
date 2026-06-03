'use client';

import { useCallback, useState, useRef } from 'react';
import type {
  Assessment, Question, SubQuestion,
  CourseLevel, QuestionType, ActionWord, CognitiveLevel, WorkingSpace,
} from '@/lib/types';
import { newQuestion, newSubQuestion, computeTotalMarks, newAssessment } from '@/lib/assessment-utils';

interface Props {
  assessment: Assessment;
  onChange: (a: Assessment) => void;
  onSaved: () => void;
}

const COURSES: CourseLevel[] = ['Math 9 Extended', 'Math 9 Standard'];
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'inequality',          label: 'Inequalities' },
  { value: 'geometry',            label: 'Geometry / Angles' },
  { value: 'special-triangles',   label: 'Special Right Triangles' },
  { value: 'system-equations',    label: 'Systems of Equations' },
  { value: 'system-inequalities', label: 'Systems of Inequalities' },
  { value: 'word-problem',        label: 'Word Problem / Modeling' },
  { value: 'other',               label: 'Other' },
];
const ACTION_WORDS: ActionWord[] = [
  'Find','Solve','Write','Graph','Calculate','Determine',
  'State','Show','Justify','Classify','Define','Explain',
];
const WORKING_SPACES: { value: WorkingSpace; label: string; hint: string }[] = [
  { value: 'short',      label: 'Short',      hint: '~3 cm' },
  { value: 'procedural', label: 'Procedural', hint: '~5 cm' },
  { value: 'extended',   label: 'Extended',   hint: '~7 cm' },
];

const EXAMPLE_PROMPTS = [
  'KA #3, Math 9 Extended, Block 4, May 2025, 50 min, GDC required. Topics: compound inequalities (2 parts), angle relationships with parallel lines (3 parts), special right triangles with surds (2 parts), system of equations, graphing system of inequalities, and a school-context word problem with 5 parts.',
  'Math 9 Standard, Block 2, KA #2, March 2025, 50 min, no GDC. 5 questions: simple linear inequalities, supplementary and vertical angles, Pythagorean theorem with clean numbers, system of equations with one coefficient equal to 1, and a simple word problem about buying school supplies.',
  'Math 9 Extended KA #1, Block 3, February 2025, 45 min, GDC required. Focus on inequalities only — 3 compound inequality questions (algebraic, interval, number line), 1 absolute value inequality, and 1 real-world inequality modeling question.',
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-[#13131a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[rgb(0,102,204)] transition-colors';
const labelCls = 'block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1';

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
        active
          ? 'border-[rgb(0,102,204)] bg-[rgb(0,102,204)]/20 text-blue-300'
          : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
      }`}>
      {label}
    </button>
  );
}

function LevelBadge({ level, onClick }: { level: CognitiveLevel; onClick: () => void }) {
  const colors: Record<CognitiveLevel, string> = {
    1: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    2: 'bg-amber-900/40   text-amber-400  border-amber-800',
    3: 'bg-rose-900/40    text-rose-400   border-rose-800',
  };
  const labels: Record<CognitiveLevel, string> = { 1: 'L1 Recall', 2: 'L2 Apply', 3: 'L3 Analyze' };
  return (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all hover:opacity-80 ${colors[level]}`}>
      {labels[level]}
    </button>
  );
}

// ─── SubQuestion editor ──────────────────────────────────────────────────────
function SubQuestionEditor({ sq, letter, onUpdate, onRemove, canRemove }: {
  sq: SubQuestion; letter: string;
  onUpdate: (p: Partial<SubQuestion>) => void;
  onRemove: () => void; canRemove: boolean;
}) {
  const cycleLevel = () => {
    const next: Record<CognitiveLevel, CognitiveLevel> = { 1: 2, 2: 3, 3: 1 };
    onUpdate({ level: next[sq.level] });
  };
  return (
    <div className="rounded-xl border border-white/8 bg-[#0f0f16] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: 'rgb(0,102,204)' }}>{letter}.</span>
        <div className="flex items-center gap-2">
          <LevelBadge level={sq.level} onClick={cycleLevel} />
          {canRemove && (
            <button type="button" onClick={onRemove}
              className="text-gray-600 hover:text-rose-400 text-xs transition-colors">✕</button>
          )}
        </div>
      </div>

      <div>
        <span className={labelCls}>Action word</span>
        <div className="flex flex-wrap gap-1.5">
          {ACTION_WORDS.map(w => (
            <button key={w} type="button" onClick={() => onUpdate({ actionWord: w })}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all border ${
                sq.actionWord === w
                  ? 'border-[rgb(204,0,0)] bg-[rgb(204,0,0)]/20 text-red-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}>{w}</button>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>Prompt</span>
        <textarea value={sq.prompt} onChange={e => onUpdate({ prompt: e.target.value })}
          rows={2} placeholder={`${sq.actionWord} the value of ...`}
          className={inputCls + ' resize-none font-mono text-xs'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>Working space</span>
          <div className="flex gap-1.5">
            {WORKING_SPACES.map(ws => (
              <Pill key={ws.value} label={`${ws.label} ${ws.hint}`}
                active={sq.workingSpace === ws.value}
                onClick={() => onUpdate({ workingSpace: ws.value })} />
            ))}
          </div>
        </div>
        <div>
          <span className={labelCls}>Marks</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onUpdate({ marks: Math.max(1, sq.marks - 1) })}
              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold">−</button>
            <span className="text-sm font-bold text-white w-4 text-center">{sq.marks}</span>
            <button type="button" onClick={() => onUpdate({ marks: Math.min(12, sq.marks + 1) })}
              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold">+</button>
          </div>
        </div>
      </div>

      <div>
        <span className={labelCls}>Diagram hint
          <span className="normal-case font-normal text-gray-600 ml-1">(optional — TikZ description)</span>
        </span>
        <input type="text" value={sq.diagramHint} onChange={e => onUpdate({ diagramHint: e.target.value })}
          placeholder="e.g. right triangle, legs √3 and √6, yellow fill, right angle at C"
          className={inputCls + ' text-xs'} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={sq.continuesOnNextPage}
          onChange={e => onUpdate({ continuesOnNextPage: e.target.checked })}
          className="w-3.5 h-3.5 accent-blue-500" />
        <span className="text-xs text-gray-500">Continues onto next page</span>
      </label>
    </div>
  );
}

// ─── Question editor ─────────────────────────────────────────────────────────
function QuestionEditor({ q, onUpdate, onRemove, canRemove }: {
  q: Question;
  onUpdate: (p: Partial<Question>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const updateSQ = (idx: number, patch: Partial<SubQuestion>) =>
    onUpdate({ subQuestions: q.subQuestions.map((sq, i) => i === idx ? { ...sq, ...patch } : sq) });
  const addSQ = () => onUpdate({ subQuestions: [...q.subQuestions, newSubQuestion()] });
  const removeSQ = (idx: number) => onUpdate({ subQuestions: q.subQuestions.filter((_, i) => i !== idx) });
  const totalMark = q.subQuestions.reduce((s, sq) => s + sq.marks, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'rgb(204,85,0)' }}>{q.number}</span>
          <span className="text-xs font-semibold text-gray-300">{q.topic || 'Untitled question'}</span>
          <span className="text-[10px] text-gray-600">{totalMark} mark{totalMark !== 1 ? 's' : ''}</span>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="text-xs text-gray-600 hover:text-rose-400 transition-colors px-2 py-1">Remove</button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>Topic / title</span>
            <input type="text" value={q.topic} onChange={e => onUpdate({ topic: e.target.value })}
              placeholder="e.g. Compound Inequalities" className={inputCls} />
          </div>
          <div>
            <span className={labelCls}>Question type</span>
            <select value={q.type} onChange={e => onUpdate({ type: e.target.value as QuestionType })}
              className={inputCls + ' cursor-pointer'}>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <span className={labelCls}>Question stem
            <span className="normal-case font-normal text-gray-600 ml-1">(intro before sub-parts, or leave blank)</span>
          </span>
          <textarea value={q.stem} onChange={e => onUpdate({ stem: e.target.value })} rows={2}
            placeholder="e.g. Solve each inequality, writing the solution in algebraic, interval, and geometric representations."
            className={inputCls + ' resize-none text-sm'} />
        </div>

        <div className="space-y-3">
          {q.subQuestions.map((sq, idx) => (
            <SubQuestionEditor key={sq.id} sq={sq} letter={'abcdefghij'[idx]}
              onUpdate={patch => updateSQ(idx, patch)}
              onRemove={() => removeSQ(idx)}
              canRemove={q.subQuestions.length > 1} />
          ))}
          <button type="button" onClick={addSQ}
            className="w-full py-2 rounded-lg border border-dashed border-white/15 text-xs text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all">
            + Add sub-question
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Panel ────────────────────────────────────────────────────────────────
function AiPanel({ onAssessmentReady }: { onAssessmentReady: (a: Assessment) => void }) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!description.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/build-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error ${res.status}`);
      }
      const assessment: Assessment = await res.json();
      onAssessmentReady(assessment);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const useExample = (ex: string) => {
    setDescription(ex);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">✨</span>
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-widest">AI Build</h2>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Describe your assessment in plain English. Claude will scaffold the full question structure for you to review and edit.
        </p>
      </div>

      {/* Input area */}
      <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={8}
          placeholder="e.g. KA #3, Math 9 Extended, Block 4, May 2025, 50 min, GDC required. Topics: compound inequalities (2 parts), angle relationships (3 parts), special right triangles (2 parts), system of equations, graphing inequalities, and a word problem with 5 parts."
          className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-700 focus:outline-none focus:border-[rgb(0,102,204)] transition-colors resize-none leading-relaxed"
        />

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-lg text-red-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg text-xs font-semibold text-center"
            style={{ background: 'rgba(0,102,204,0.15)', color: 'rgb(147,197,253)', border: '1px solid rgba(0,102,204,0.3)' }}>
            ✓ Assessment scaffolded — review and edit on the right
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading || !description.trim()}
          className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: isLoading ? 'rgb(30,30,40)' : 'rgb(0,102,204)' }}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }} />
              <span className="text-gray-400">Building assessment…</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Build with AI</span>
            </>
          )}
        </button>

        {/* Example prompts */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Examples</p>
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button key={i} type="button" onClick={() => useExample(ex)}
              className="w-full text-left p-3 rounded-lg border border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-all">
              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{ex}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Meta panel ──────────────────────────────────────────────────────────────
function MetaPanel({ meta, onChange }: {
  meta: Assessment['meta'];
  onChange: <K extends keyof Assessment['meta']>(k: K, v: Assessment['meta'][K]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className={labelCls}>Course</span>
        <div className="space-y-1.5">
          {COURSES.map(c => (
            <button key={c} type="button" onClick={() => onChange('course', c)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                meta.course === c
                  ? 'border-[rgb(0,102,204)] bg-[rgb(0,102,204)]/15 text-blue-300'
                  : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelCls}>Block</span>
          <input type="text" value={meta.block} onChange={e => onChange('block', e.target.value)}
            placeholder="e.g. 4" className={inputCls} />
        </div>
        <div>
          <span className={labelCls}>KA #</span>
          <input type="number" value={meta.assessmentNumber} min={1}
            onChange={e => onChange('assessmentNumber', Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      <div>
        <span className={labelCls}>Month &amp; Year</span>
        <input type="text" value={meta.monthYear} onChange={e => onChange('monthYear', e.target.value)}
          placeholder="e.g. May 2025" className={inputCls} />
      </div>

      <div>
        <span className={labelCls}>Duration (min)</span>
        <input type="number" value={meta.durationMinutes} min={10} max={180}
          onChange={e => onChange('durationMinutes', Number(e.target.value))} className={inputCls} />
      </div>

      <div>
        <span className={labelCls}>Calculator</span>
        <div className="flex gap-2">
          {([true, false] as const).map(v => (
            <button key={String(v)} type="button" onClick={() => onChange('gdcRequired', v)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                meta.gdcRequired === v
                  ? 'border-[rgb(204,85,0)] bg-[rgb(204,85,0)]/15 text-orange-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}>
              {v ? 'GDC Required' : 'No GDC'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main BuildTab ────────────────────────────────────────────────────────────
export default function BuildTab({ assessment, onChange, onSaved }: Props) {
  const { meta, questions } = assessment;
  const totalMarks = computeTotalMarks(questions);
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'>('idle');

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
    const qs = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 }));
    onChange({ ...assessment, questions: qs, totalMarks: computeTotalMarks(qs), updatedAt: new Date().toISOString() });
  };

  const handleAssessmentReady = useCallback((a: Assessment) => {
    onChange({ ...a, updatedAt: new Date().toISOString() });
  }, [onChange]);

  const handleReset = () => onChange(newAssessment());

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assessment, totalMarks }),
      });
      setSaveState('saved');
      onSaved();
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      console.error('Save failed', err);
      setSaveState('idle');
    }
  };

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Column 1: AI panel ── */}
      <div className="w-80 shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
        <AiPanel onAssessmentReady={handleAssessmentReady} />
      </div>

      {/* ── Column 2: Meta + controls ── */}
      <aside className="w-64 shrink-0 border-r border-white/8 p-5 overflow-y-auto flex flex-col gap-5">
        <div>
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Assessment Info</h2>
          <MetaPanel meta={meta} onChange={setMeta} />
        </div>

        {/* Stats */}
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
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">L1 / L2 / L3</span>
            <span className="font-semibold text-gray-200">
              {[1,2,3].map(l =>
                questions.flatMap(q => q.subQuestions).filter(sq => sq.level === l).length
              ).join(' / ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button type="button" onClick={handleSave} disabled={saveState === 'saving'}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: saveState === 'saved' ? 'rgb(16,185,129)' : 'rgb(0,102,204)' }}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save to Library'}
          </button>
          <button type="button" onClick={handleReset}
            className="w-full py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 border border-white/6 hover:border-white/15 transition-all">
            Reset to blank
          </button>
        </div>
      </aside>

      {/* ── Column 3: Question editors ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-200">Questions</h2>
          <span className="text-xs text-gray-600">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} marks
          </span>
        </div>

        {questions.map((q, idx) => (
          <QuestionEditor key={q.id} q={q}
            onUpdate={patch => updateQuestion(idx, patch)}
            onRemove={() => removeQuestion(idx)}
            canRemove={questions.length > 1} />
        ))}

        <button type="button" onClick={addQuestion}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-white/10 text-sm text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all">
          + Add question manually
        </button>
      </div>
    </div>
  );
}
