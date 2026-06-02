import { NextRequest } from 'next/server';
import { dbGet, dbSet, dbSAdd, dbSMembers } from '@/lib/db';
import type { Assessment, AssessmentSummary } from '@/lib/types';
import { toSummary, computeTotalMarks } from '@/lib/assessment-utils';

export const runtime = 'nodejs';

export async function GET() {
  const ids = await dbSMembers('assessments');
  const items = (
    await Promise.all(ids.map(id => dbGet<Assessment>(`assessment:${id}`)))
  ).filter(Boolean) as Assessment[];
  const summaries: AssessmentSummary[] = items
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(toSummary);
  return Response.json(summaries);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Assessment;
  if (!body.meta || !body.questions) {
    return Response.json({ error: 'Invalid assessment' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = body.id ?? crypto.randomUUID();
  const assessment: Assessment = {
    ...body,
    id,
    totalMarks: computeTotalMarks(body.questions),
    updatedAt: now,
    createdAt: body.createdAt ?? now,
  };

  await dbSet(`assessment:${id}`, assessment);
  await dbSAdd('assessments', id);

  return Response.json(toSummary(assessment), { status: 201 });
}
