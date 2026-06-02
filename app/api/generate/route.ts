import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import type { Assessment, Question, SubQuestion } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const client = new Anthropic();

function buildUserPrompt(assessment: Assessment): string {
  const { meta, questions } = assessment;
  const totalMarks = questions.reduce(
    (sum, q) => sum + q.subQuestions.reduce((s, sq) => s + sq.marks, 0), 0
  );

  const lines: string[] = [
    `COURSE: ${meta.course}`,
    `BLOCK: ${meta.block}`,
    `KEY ASSESSMENT NUMBER: ${meta.assessmentNumber}`,
    `MONTH/YEAR: ${meta.monthYear}`,
    `DURATION: ${meta.durationMinutes} minutes`,
    `GDC REQUIRED: ${meta.gdcRequired}`,
    `TOTAL QUESTIONS: ${questions.length}`,
    `TOTAL MARKS: ${totalMarks}`,
    '',
    '=== QUESTIONS ===',
  ];

  questions.forEach((q: Question) => {
    const qMarks = q.subQuestions.reduce((s: number, sq: SubQuestion) => s + sq.marks, 0);
    lines.push('');
    lines.push(`QUESTION ${q.number} — ${q.topic || 'no topic'} (${q.type}) [${qMarks} marks]`);
    if (q.stem) lines.push(`STEM: ${q.stem}`);
    q.subQuestions.forEach((sq: SubQuestion, i: number) => {
      const letter = 'abcdefghij'[i];
      lines.push(`  (${letter}) ACTION: ${sq.actionWord} | PROMPT: ${sq.prompt} | L${sq.level} | ${sq.marks} marks | working: ${sq.workingSpace}${sq.diagramHint ? ` | DIAGRAM: ${sq.diagramHint}` : ''}${sq.continuesOnNextPage ? ' | CONTINUES ON NEXT PAGE' : ''}`);
    });
  });

  lines.push('');
  lines.push('Generate the complete LaTeX document now. Output raw LaTeX only — no markdown, no fences, no preamble text.');

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY is not set.', { status: 500 });
  }

  let assessment: Assessment;
  try {
    ({ assessment } = await req.json());
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  if (!assessment?.meta || !assessment?.questions?.length) {
    return new Response('assessment with meta and questions is required.', { status: 400 });
  }

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), 'FDR_SYSTEM_PROMPT.md'),
    'utf-8',
  );

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
  const userPrompt = buildUserPrompt(assessment);

  const stream = client.messages.stream({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
