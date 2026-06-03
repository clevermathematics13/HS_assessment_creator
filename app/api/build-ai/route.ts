import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set.', { status: 500 });
  }

  let description: string;
  try {
    ({ description } = await req.json());
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

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';

  // Non-streaming: we need the full JSON before parsing
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `SCAFFOLD MODE\n\nParse the following description and return ONLY a valid JSON object matching the Assessment schema. No markdown, no backticks, no commentary.\n\nDescription:\n${description}`,
      },
    ],
  });

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
    // strip any accidental ```json fences
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  // Validate it parses
  try {
    JSON.parse(raw);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Model returned invalid JSON', raw }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(raw, {
    headers: { 'Content-Type': 'application/json' },
  });
}
