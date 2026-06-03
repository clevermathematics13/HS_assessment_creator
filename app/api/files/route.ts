import { NextRequest } from 'next/server';
import { dbGet, dbSet, dbSAdd, dbSMembers } from '@/lib/db';
import type { RepoFile, RepoFileSummary } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── GET: list all files (summaries only) ────────────────────────────────────
export async function GET() {
  const ids = await dbSMembers('repofiles');
  const files = (
    await Promise.all(ids.map(id => dbGet<RepoFile>(`repofile:${id}`)))
  ).filter(Boolean) as RepoFile[];

  const summaries: RepoFileSummary[] = files
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      source: f.source,
      sizeChars: f.sizeChars,
      createdAt: f.createdAt,
    }));

  return Response.json(summaries);
}

// ─── POST: add a file ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';

  let name: string;
  let type: RepoFile['type'];
  let source: RepoFile['source'];
  let googleUrl: string | undefined;
  let extractedText: string;

  // ── Google URL path ──────────────────────────────────────────────────────
  if (contentType.includes('application/json')) {
    const body = await req.json();
    if (!body.googleUrl || !body.name) {
      return Response.json({ error: 'googleUrl and name are required' }, { status: 400 });
    }
    name = body.name.trim();
    type = 'google';
    source = 'google';
    googleUrl = body.googleUrl.trim() as string;

    try {
      extractedText = await fetchGoogleDocText(googleUrl);
    } catch (err) {
      return Response.json(
        { error: `Could not fetch Google file: ${err instanceof Error ? err.message : String(err)}` },
        { status: 400 }
      );
    }
  }
  // ── File upload path ─────────────────────────────────────────────────────
  else if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return Response.json({ error: 'file is required' }, { status: 400 });

    name = file.name;
    source = 'upload';
    googleUrl = undefined;

    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') type = 'pdf';
    else if (ext === 'docx' || ext === 'doc') type = 'docx';
    else if (ext === 'md') type = 'md';
    else if (ext === 'tex') type = 'tex';
    else type = 'txt';

    const bytes = await file.arrayBuffer();
    extractedText = await extractText(type, Buffer.from(bytes));
  } else {
    return Response.json({ error: 'Unsupported content type' }, { status: 415 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const repoFile: RepoFile = {
    id, name, type, source,
    googleUrl,
    extractedText: extractedText.slice(0, 120_000),
    sizeChars: Math.min(extractedText.length, 120_000),
    createdAt: now,
    updatedAt: now,
  };

  await dbSet(`repofile:${id}`, repoFile);
  await dbSAdd('repofiles', id);

  return Response.json({ id, name, type, source, sizeChars: repoFile.sizeChars }, { status: 201 });
}

// ─── Text extraction ─────────────────────────────────────────────────────────
async function extractText(type: RepoFile['type'], buf: Buffer): Promise<string> {
  if (type === 'pdf') return extractPdfText(buf);
  if (type === 'docx') return extractDocxText(buf);
  return buf.toString('utf-8'); // md, tex, txt
}

async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse').then(m => m.default ?? m);
    const data = await (pdfParse as (b: Buffer) => Promise<{ text: string }>)(buf);
    return data.text ?? '';
  } catch {
    // Fallback: extract printable ASCII spans from raw bytes
    const raw = buf.toString('latin1');
    const chunks: string[] = [];
    const re = /[\x20-\x7E\n\r\t]{4,}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) chunks.push(m[0]);
    return chunks.join(' ');
  }
}

async function extractDocxText(buf: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value ?? '';
  } catch {
    return buf.toString('utf-8');
  }
}

async function fetchGoogleDocText(url: string): Promise<string> {
  let exportUrl: string;

  if (url.includes('docs.google.com/document')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Doc ID from URL');
    exportUrl = `https://docs.google.com/document/d/${idMatch[1]}/export?format=txt`;
  } else if (url.includes('docs.google.com/spreadsheets')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Sheets ID from URL');
    exportUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
  } else if (url.includes('docs.google.com/presentation')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Slides ID from URL');
    exportUrl = `https://docs.google.com/presentation/d/${idMatch[1]}/export/txt`;
  } else {
    exportUrl = url;
  }

  const res = await fetch(exportUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} — make sure the file is shared publicly (Anyone with link can view)`
    );
  }
  const text = await res.text();
  if (!text.trim()) throw new Error('File appears empty or could not be read');
  return text;
}
