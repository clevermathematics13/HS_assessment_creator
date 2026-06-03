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
    googleUrl = body.googleUrl.trim();

    // Fetch the Google Doc export as plain text
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

    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext)) type = 'pdf';
    else if (['docx', 'doc'].includes(ext)) type = 'docx';
    else if (['md'].includes(ext)) type = 'md';
    else if (['tex'].includes(ext)) type = 'tex';
    else if (['txt'].includes(ext)) type = 'txt';
    else type = 'txt'; // fallback

    const bytes = await file.arrayBuffer();
    extractedText = await extractText(type, Buffer.from(bytes), name);
  } else {
    return Response.json({ error: 'Unsupported content type' }, { status: 415 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const repoFile: RepoFile = {
    id, name, type, source,
    googleUrl,
    extractedText: extractedText.slice(0, 120_000), // cap at ~120k chars
    sizeChars: Math.min(extractedText.length, 120_000),
    createdAt: now,
    updatedAt: now,
  };

  await dbSet(`repofile:${id}`, repoFile);
  await dbSAdd('repofiles', id);

  return Response.json({ id, name, type, source, sizeChars: repoFile.sizeChars }, { status: 201 });
}

// ─── Text extraction ─────────────────────────────────────────────────────────
async function extractText(type: RepoFile['type'], buf: Buffer, name: string): Promise<string> {
  if (type === 'pdf') {
    return extractPdfText(buf);
  }
  if (type === 'docx') {
    return extractDocxText(buf);
  }
  // md, tex, txt — all plain text
  return buf.toString('utf-8');
}

async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    // Use pdf-parse if available, otherwise fall back to raw buffer text
    const pdfParse = await import('pdf-parse').then(m => m.default || m);
    const data = await pdfParse(buf);
    return data.text ?? '';
  } catch {
    // Fallback: extract printable ASCII from PDF bytes
    const raw = buf.toString('latin1');
    const chunks: string[] = [];
    const re = /[\x20-\x7E\n\r\t]{4,}/g;
    let m;
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
  // Detect type from URL and build export URL
  let exportUrl: string;

  if (url.includes('docs.google.com/document')) {
    // Google Doc → export as plain text
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Doc ID from URL');
    exportUrl = `https://docs.google.com/document/d/${idMatch[1]}/export?format=txt`;
  } else if (url.includes('docs.google.com/spreadsheets')) {
    // Google Sheets → export as CSV
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Sheets ID from URL');
    exportUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
  } else if (url.includes('docs.google.com/presentation')) {
    // Google Slides → export as plain text
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) throw new Error('Could not parse Google Slides ID from URL');
    exportUrl = `https://docs.google.com/presentation/d/${idMatch[1]}/export/txt`;
  } else if (url.includes('drive.google.com/file')) {
    // Direct Drive file link — try to fetch as-is
    exportUrl = url;
  } else {
    // Generic URL — try to fetch
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
