'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  latex: string;
}

type PreviewState = 'empty' | 'no-latex' | 'instructions' | 'loading' | 'loaded' | 'error';

export default function PreviewTab({ latex }: Props) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [state, setState] = useState<PreviewState>('empty');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.4);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    if (!latex) setState('no-latex');
    else setState('instructions');
  }, [latex]);

  const renderPage = useCallback(async (pageNum: number, doc: unknown, sc: number) => {
    if (!canvasRef.current) return;
    // cancel any in-flight render
    renderTaskRef.current?.cancel();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (doc as any).getPage(pageNum);
    const viewport = page.getViewport({ scale: sc });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try { await task.promise; } catch { /* cancelled */ }
  }, []);

  const loadPdf = useCallback(async (url: string) => {
    setState('loading');
    try {
      // dynamic import to avoid SSR issues
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument(url).promise;
      pdfDocRef.current = doc;
      setPageCount(doc.numPages);
      setCurrentPage(1);
      await renderPage(1, doc, scale);
      setState('loaded');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, [renderPage, scale]);

  // Re-render when page or scale changes
  useEffect(() => {
    if (pdfDocRef.current && state === 'loaded') {
      renderPage(currentPage, pdfDocRef.current, scale);
    }
  }, [currentPage, scale, state, renderPage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    loadPdf(url);
  };

  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pdfUrl.trim()) loadPdf(pdfUrl.trim());
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-white/8 p-4 overflow-y-auto space-y-5">
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Load PDF</h3>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Compile your LaTeX on Overleaf, download the PDF, then upload it here for in-browser preview.
          </p>

          {/* File upload */}
          <label className="block cursor-pointer">
            <div
              className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-white/25 transition-colors"
            >
              <p className="text-2xl mb-1">📄</p>
              <p className="text-xs text-gray-400 font-medium">Upload PDF</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Click or drag & drop</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <p className="text-[10px] text-gray-600 text-center my-2">— or paste URL —</p>

          {/* URL input */}
          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2">
            <input
              type="url"
              value={pdfUrl}
              onChange={e => setPdfUrl(e.target.value)}
              placeholder="https://…/file.pdf"
              className="w-full bg-[#13131a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[rgb(0,102,204)]"
            />
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'rgb(0,102,204)' }}
            >
              Load from URL
            </button>
          </form>
        </div>

        {/* Overleaf shortcut */}
        <div className="rounded-xl border border-white/8 p-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overleaf Workflow</p>
          <ol className="text-[10px] text-gray-500 space-y-1.5 list-decimal list-inside">
            <li>Copy LaTeX from Generate tab</li>
            <li>Paste into new Overleaf project</li>
            <li>Add FDR_secondary_logo.svg to project</li>
            <li>Compile twice (pdflatex)</li>
            <li>Download PDF and upload here</li>
          </ol>
          <a
            href="https://www.overleaf.com/project"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-1.5 rounded-lg text-[10px] font-semibold text-white mt-2 hover:opacity-90 transition-all"
            style={{ background: 'rgb(204,85,0)' }}
          >
            Open Overleaf ↗
          </a>
        </div>

        {/* Page controls */}
        {state === 'loaded' && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Navigation</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-gray-300"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-gray-300"
                >
                  Next →
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Zoom ({Math.round(scale * 100)}%)
              </p>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={scale}
                onChange={e => setScale(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )}
      </aside>

      {/* ── Right: PDF canvas ── */}
      <div className="flex-1 overflow-auto bg-[#111116] flex items-start justify-center p-6">
        {state === 'no-latex' && (
          <div className="text-center space-y-3 mt-24">
            <p className="text-4xl">⚡</p>
            <p className="text-sm text-gray-400">Generate your LaTeX first</p>
            <p className="text-xs text-gray-600">Go to the Generate tab and click Generate LaTeX</p>
          </div>
        )}
        {state === 'empty' && (
          <div className="text-center space-y-3 mt-24">
            <p className="text-4xl">👁️</p>
            <p className="text-sm text-gray-400">PDF preview</p>
            <p className="text-xs text-gray-600">Upload or link a compiled PDF to preview it here</p>
          </div>
        )}
        {state === 'instructions' && (
          <div className="text-center space-y-3 mt-24">
            <p className="text-4xl">📋</p>
            <p className="text-sm text-gray-400">LaTeX ready — compile on Overleaf then upload the PDF</p>
            <p className="text-xs text-gray-600">Use the panel on the left to upload or paste a URL</p>
          </div>
        )}
        {state === 'loading' && (
          <div className="text-center space-y-3 mt-24">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgb(0,102,204)', borderTopColor: 'transparent' }}
            />
            <p className="text-xs text-gray-500">Loading PDF…</p>
          </div>
        )}
        {state === 'error' && (
          <div className="text-center space-y-3 mt-24">
            <p className="text-4xl">⚠️</p>
            <p className="text-sm text-red-400">Failed to load PDF</p>
            <p className="text-xs text-gray-600">Check the URL or try re-uploading</p>
          </div>
        )}
        {state === 'loaded' && (
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(0,102,204,0.15)' }}
          >
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}
