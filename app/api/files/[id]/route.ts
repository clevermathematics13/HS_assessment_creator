import { NextRequest } from 'next/server';
import { dbGet, dbDel, dbSRem } from '@/lib/db';
import type { RepoFile } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await dbGet<RepoFile>(`repofile:${params.id}`);
  if (!file) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(file);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbDel(`repofile:${params.id}`);
  await dbSRem('repofiles', params.id);
  return new Response(null, { status: 204 });
}
