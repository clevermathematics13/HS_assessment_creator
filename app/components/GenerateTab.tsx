'use client';

import { useState, useRef, useEffect } from 'react';
import type { Assessment } from '@/lib/types';
import { computeTotalMarks, makeAssessmentTitle } from '@/lib/assessment-utils';

interface Props {
  assessment: Assessment;
  onLatexReady: (latex: string) => void;
  onGoToPreview: () => void;
}

export default function GenerateTab({ assessment, onLatexReady, onGoToPreview }: Props) {
  const [latex, setLatex] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (outputRef.current && isLoading) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [latex, isLoading]);

  const totalMarks = computeTotalMarks(assessment.questions);
  const title = makeAssessmentTitle(assessment.meta);

  const validate = (): string | null => {
    if (!assessment.meta.block.trim()) return 'Please fill in the Block in the Build tab.';
    if (!assessment.meta.monthYear.trim()) return 'Please fill in Month & Year in the Build tab.';
    if (assessment.questions.length === 0) return 'Please add at least one question in the Build tab.';
    const empty = assessment.questions.find(q =>
      q.subQuestions.some(sq => !sq.prompt.trim())
    );
    if (empty) return `Question ${empty.number} has a sub-question with an empty prompt.`;
    return null;
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLatex('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error((await response.text()) || `Server error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setLatex(full);
      }
      onLatexReady(full);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setIsLoading(false); };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-white/8 px-6 py-3 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-200">{title}</p>
          <p className="text-xs text-gray-500">
            {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;
            {totalMarks} marks
            &nbsp;·&nbsp;
            {assessment.meta.gdcRequired ? 'GDC required' : 'No GDC'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {latex && !isLoading && (
            <>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy LaTeX'}
              </button>
              <button
                onClick={() => {
                  onLatexReady(latex);
                  onGoToPreview();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'rgb(0,102,204)' }}
              >
                Preview PDF →
              </button>
              <a
                href="https://www.overleaf.com/project"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'rgb(204,85,0)' }}
              >
                Open Overleaf ↗
              </a>
            </>
          )}
          {isLoading ? (
            <button
              onClick={handleStop}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-5 py-1.5 rounded-lg text-xs font-black text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'rgb(204,85,0)' }}
            >
              ⚡ Generate LaTeX
            </button>
          )}
        </div>
      </div>

      {/* ── Assessment summary cards ── */}
      {!latex && !isLoading && (
        <div className="shrink-0 px-6 py-4 border-b border-white/8">
          <p className="text-xs text-gray-500 mb-3">Assessment overview — review before generating</p>
          <div className="flex flex-wrap gap-2">
            {assessment.questions.map(q => {
              const qMarks = q.subQuestions.reduce((s, sq) => s + sq.marks, 0);
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-white/8 px-3 py-2 bg-[#0f0f16] min-w-[140px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center"
                      style={{ background: 'rgb(204,85,0)' }}
                    >
                      {q.number}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[100px]">
                      {q.topic || 'No topic'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {q.subQuestions.length} part{q.subQuestions.length !== 1 ? 's' : ''} · {qMarks} marks
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {q.subQuestions.map((sq, i) => (
                      <span
                        key={sq.id}
                        className="text-[9px] px-1 py-0.5 rounded"
                        style={{
                          background: sq.level === 1 ? 'rgba(16,185,129,0.15)'
                            : sq.level === 2 ? 'rgba(245,158,11,0.15)'
                            : 'rgba(239,68,68,0.15)',
                          color: sq.level === 1 ? '#34d399'
                            : sq.level === 2 ? '#fbbf24'
                            : '#f87171',
                        }}
                      >
                        {'abcdefghij'[i]} · L{sq.level} · {sq.marks}m
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LaTeX output ── */}
      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-3">
        {error && (
          <div className="shrink-0 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex-1 bg-[#0d0d14] border border-white/8 rounded-xl overflow-hidden flex flex-col">
          {latex ? (
            <pre
              ref={outputRef}
              className="flex-1 p-5 text-xs text-gray-300 font-mono whitespace-pre-wrap break-words overflow-auto leading-relaxed"
            >
              {latex}
              {isLoading && <span className="animate-pulse" style={{ color: 'rgb(204,85,0)' }}>▌</span>}
            </pre>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center space-y-3">
                  <div
                    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                    style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }}
                  />
                  <p className="text-xs text-gray-500">Generating your assessment…</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-3xl">⚡</p>
                  <p className="text-sm text-gray-500">Click Generate LaTeX to build your assessment</p>
                  <p className="text-xs text-gray-700">FDR template conventions will be applied automatically</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
