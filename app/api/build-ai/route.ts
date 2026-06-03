import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { dbGet, dbSMembers } from '@/lib/db';
import type { RepoFile } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set.', { status: 500 });
  }

  let description: string;
  let selectedFileIds: string[] = [];

  try {
    ({ description, selectedFileIds = [] } = await req.json());
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  if (!description?.trim()) {
    return new Response('description is required.', { status: 400 });
  }

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), 'FDR_SYSTEM_PROMPT.md'),
    'utf-8',
  );

  // ── Fetch selected repo files ───────────────────────────────────────────
  let fileContext = '';
  if (selectedFileIds.length > 0) {
    const files = (
      await Promise.all(selectedFileIds.map(id => dbGet<RepoFile>(`repofile:${id}`)))
    ).filter(Boolean) as RepoFile[];

    if (files.length > 0) {
      fileContext = files.map(f =>
        `\n\n=== REPOSITORY FILE: ${f.name} (${f.type}) ===\n${f.extractedText}\n=== END: ${f.name} ===`
      ).join('');
    }
  }

  const userContent = [
    'SCAFFOLD MODE',
    '',
    'Parse the following description and return ONLY a valid JSON object matching the Assessment schema.',
    'No markdown, no backticks, no commentary.',
    fileContext
      ? 'The repository files below contain curriculum context, past assessments, unit plans, and other teacher materials. Read them carefully and use them to inform the question content, difficulty, and topic alignment.'
      : '',
    fileContext,
    '',
    'Description:',
    description,
  ].filter(s => s !== undefined).join('\n');

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    JSON.parse(raw);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Model returned invalid JSON', raw }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
}
