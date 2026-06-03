'use client';

import { useState, useCallback } from 'react';
import BuildTab from './components/BuildTab';
import GenerateTab from './components/GenerateTab';
import PreviewTab from './components/PreviewTab';
import LibraryTab from './components/LibraryTab';
import FilesTab from './components/FilesTab';
import { newAssessment } from '@/lib/assessment-utils';
import type { Assessment } from '@/lib/types';

type Tab = 'build' | 'generate' | 'preview' | 'library' | 'files';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'build',    label: 'Build',    icon: '✏️' },
  { id: 'generate', label: 'Generate', icon: '⚡' },
  { id: 'preview',  label: 'Preview',  icon: '👁️' },
  { id: 'library',  label: 'Library',  icon: '📚' },
  { id: 'files',    label: 'Files',    icon: '📂' },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>('build');
  const [assessment, setAssessment] = useState<Assessment>(newAssessment);
  const [latex, setLatex] = useState('');
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);

  const handleAssessmentSaved = useCallback(() => {
    setLibraryRefreshKey(k => k + 1);
  }, []);

  const handleLoadFromLibrary = useCallback((a: Assessment) => {
    setAssessment(a);
    setLatex('');
    setTab('build');
  }, []);

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-white/10 px-5 py-2.5 flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            <div className="w-1 h-8 rounded-sm" style={{background:'rgb(204,85,0)'}} />
            <div className="w-1 h-8 rounded-sm" style={{background:'rgb(0,102,204)'}} />
            <div className="w-1 h-8 rounded-sm" style={{background:'rgb(204,0,0)'}} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-wide">FDR Assessment Creator</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Key Assessment builder · Math 9</p>
          </div>
        </div>
        <nav className="flex gap-1 ml-2">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === id ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
              style={tab === id ? {background:'rgb(0,102,204)'} : {}}>
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="ml-auto text-xs text-gray-600">
          {assessment.meta.course
            ? `${assessment.meta.course}${assessment.meta.block ? ` · Block ${assessment.meta.block}` : ''}`
            : 'No assessment loaded'}
        </div>
      </header>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden">
        {tab === 'build' && (
          <BuildTab assessment={assessment} onChange={setAssessment} onSaved={handleAssessmentSaved} />
        )}
        {tab === 'generate' && (
          <GenerateTab assessment={assessment} onLatexReady={setLatex} onGoToPreview={() => setTab('preview')} />
        )}
        {tab === 'preview' && <PreviewTab latex={latex} />}
        {tab === 'library' && (
          <LibraryTab refreshKey={libraryRefreshKey} onLoad={handleLoadFromLibrary} />
        )}
        {tab === 'files' && <FilesTab refreshKey={filesRefreshKey} />}
      </div>
    </main>
  );
}
