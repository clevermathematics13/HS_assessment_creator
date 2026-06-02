import { NextRequest } from 'next/server';
import { dbGet, dbDel, dbSRem } from '@/lib/db';
import type { Assessment } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const assessment = await dbGet<Assessment>(`assessment:${params.id}`);
  if (!assessment) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(assessment);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbDel(`assessment:${params.id}`);
  await dbSRem('assessments', params.id);
  return new Response(null, { status: 204 });
}
