'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RepoFileSummary } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  pdf:    '📄',
  docx:   '📝',
  md:     '📋',
  tex:    '🔢',
  txt:    '📃',
  google: '🌐',
};

const TYPE_COLORS: Record<string, string> = {
  pdf:    'text-red-400 border-red-900/50 bg-red-950/30',
  docx:   'text-blue-400 border-blue-900/50 bg-blue-950/30',
  md:     'text-purple-400 border-purple-900/50 bg-purple-950/30',
  tex:    'text-orange-400 border-orange-900/50 bg-orange-950/30',
  txt:    'text-gray-400 border-gray-700/50 bg-gray-900/30',
  google: 'text-green-400 border-green-900/50 bg-green-950/30',
};

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  if (chars < 100_000) return `${(chars / 1000).toFixed(1)}k chars`;
  return `${(chars / 1000).toFixed(0)}k chars`;
}

export default function FilesTab({ refreshKey }: { refreshKey: number }) {
  const [files, setFiles] = useState<RepoFileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Google URL form
  const [googleUrl, setGoogleUrl] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) setFiles(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles, refreshKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setUploading(true);
    setUploadError('');
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/files', { method: 'POST', body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Upload failed for ${file.name}`);
        }
      }
      await fetchFiles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGoogleAdd = async () => {
    if (!googleUrl.trim()) return;
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const name = googleName.trim() || googleUrl.split('/').filter(Boolean).pop() || 'Google file';
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUrl: googleUrl.trim(), name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to import Google file');
      }
      setGoogleUrl('');
      setGoogleName('');
      await fetchFiles();
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    setFiles(f => f.filter(x => x.id !== id));
    setDeleting(null);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left: upload panel ── */}
      <aside className="w-80 shrink-0 border-r border-white/8 p-5 overflow-y-auto space-y-6">

        {/* File upload */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Upload Files</h3>
          <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
            PDF, DOCX, MD, TXT, TEX — curriculum guides, unit plans, past assessments, IB syllabi.
          </p>
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              uploading
                ? 'border-[rgb(0,102,204)]/50 bg-[rgb(0,102,204)]/5'
                : 'border-white/15 hover:border-white/25'
            }`}>
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }} />
                  <p className="text-xs text-gray-400">Uploading & extracting text…</p>
                </>
              ) : (
                <>
                  <p className="text-2xl mb-1">📂</p>
                  <p className="text-xs text-gray-400 font-medium">Click or drag & drop</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">PDF · DOCX · MD · TXT · TEX</p>
                  <p className="text-[10px] text-gray-600">Multiple files OK</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.md,.txt,.tex"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          {uploadError && (
            <p className="text-xs text-red-400 mt-2 p-2 bg-red-950/30 rounded-lg border border-red-900/40">
              {uploadError}
            </p>
          )}
        </div>

        {/* Google files */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Add Google File</h3>
          <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
            Paste a Google Doc, Sheet, or Slides URL.
            The file must be shared: <span className="text-gray-500">Anyone with the link can view</span>.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={googleName}
              onChange={e => setGoogleName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full bg-[#13131a] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[rgb(0,102,204)]"
            />
            <input
              type="url"
              value={googleUrl}
              onChange={e => setGoogleUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/…"
              className="w-full bg-[#13131a] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[rgb(0,102,204)]"
            />
            <button
              onClick={handleGoogleAdd}
              disabled={googleLoading || !googleUrl.trim()}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'rgb(0,102,204)' }}
            >
              {googleLoading ? 'Fetching…' : '+ Add Google File'}
            </button>
            {googleError && (
              <p className="text-xs text-red-400 p-2 bg-red-950/30 rounded-lg border border-red-900/40">
                {googleError}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-white/8 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total files</span>
            <span className="font-semibold text-gray-200">{files.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total text</span>
            <span className="font-semibold text-gray-200">
              {formatSize(files.reduce((s, f) => s + f.sizeChars, 0))}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Right: file list ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-200">Repository Files</h2>
          <p className="text-xs text-gray-600">
            These files are available in the Build tab when generating assessments.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }} />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-3xl">📂</p>
            <p className="text-sm text-gray-500">No files yet</p>
            <p className="text-xs text-gray-700">Upload a PDF, DOCX, or add a Google Doc to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {files.map(f => (
              <div key={f.id}
                className="rounded-2xl border border-white/8 bg-[#0f0f16] p-4 flex flex-col gap-3 hover:border-white/15 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{TYPE_ICONS[f.type] ?? '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-200 truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                        TYPE_COLORS[f.type] ?? TYPE_COLORS.txt
                      }`}>
                        {f.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-600">{formatSize(f.sizeChars)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-700">
                    {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleDelete(f.id)}
                    disabled={deleting === f.id}
                    className="text-xs text-gray-600 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-950/20 disabled:opacity-40"
                  >
                    {deleting === f.id ? '…' : '🗑 Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
