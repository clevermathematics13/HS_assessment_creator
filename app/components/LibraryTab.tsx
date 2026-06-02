'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AssessmentSummary, Assessment } from '@/lib/types';
import { makeAssessmentTitle } from '@/lib/assessment-utils';

interface Props {
  refreshKey: number;
  onLoad: (a: Assessment) => void;
}

type SortKey = 'updatedAt' | 'course' | 'assessmentNumber';

export default function LibraryTab({ refreshKey, onLoad }: Props) {
  const [summaries, setSummaries] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) setSummaries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries, refreshKey]);

  const handleLoad = async (id: string) => {
    const res = await fetch(`/api/assessments/${id}`);
    if (res.ok) onLoad(await res.json());
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
    setSummaries(s => s.filter(a => a.id !== id));
    setDeleting(null);
  };

  const sorted = [...summaries]
    .filter(a => filterCourse === 'all' || a.course === filterCourse)
    .sort((a, b) => {
      if (sortKey === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortKey === 'assessmentNumber') return a.assessmentNumber - b.assessmentNumber;
      return a.course.localeCompare(b.course);
    });

  return (
    <div className="h-full flex flex-col overflow-hidden p-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-bold text-gray-200 mr-auto">Saved Assessments</h2>

        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="bg-[#13131a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
        >
          <option value="all">All courses</option>
          <option value="Math 9 Extended">Math 9 Extended</option>
          <option value="Math 9 Standard">Math 9 Standard</option>
        </select>

        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="bg-[#13131a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
        >
          <option value="updatedAt">Most recent</option>
          <option value="assessmentNumber">KA number</option>
          <option value="course">Course</option>
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-4xl">📚</p>
          <p className="text-sm text-gray-500">
            {summaries.length === 0 ? 'No saved assessments yet' : 'No results for this filter'}
          </p>
          <p className="text-xs text-gray-700">
            {summaries.length === 0 ? 'Build one in the Build tab and click Save to Library' : ''}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sorted.map(a => (
              <div
                key={a.id}
                className="rounded-2xl border border-white/8 bg-[#0f0f16] p-4 flex flex-col gap-3 hover:border-white/15 transition-colors"
              >
                {/* Title row */}
                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black text-white"
                    style={{ background: 'rgb(204,85,0)' }}
                  >
                    {a.assessmentNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">
                      {a.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {a.course}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-[10px] text-gray-600">
                  <span>{a.questionCount} Q</span>
                  <span
                    className="font-bold"
                    style={{ color: 'rgb(204,85,0)' }}
                  >
                    {a.totalMarks} marks
                  </span>
                  <span className="ml-auto">
                    {new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleLoad(a.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'rgb(0,102,204)' }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting === a.id}
                    className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-rose-400 border border-white/8 hover:border-rose-800 transition-colors disabled:opacity-40"
                  >
                    {deleting === a.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
