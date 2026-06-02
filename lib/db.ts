/**
 * Storage abstraction:
 *  - If KV_REST_API_URL + KV_REST_API_TOKEN are set → Vercel KV (production)
 *  - Otherwise → local .db.json file (development)
 */

import fs from 'fs';
import path from 'path';

const LOCAL_PATH = path.join(process.cwd(), '.db.json');

function readLocal(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeLocal(data: Record<string, unknown>) {
  fs.writeFileSync(LOCAL_PATH, JSON.stringify(data, null, 2));
}

function useKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function dbGet<T>(key: string): Promise<T | null> {
  if (useKV()) return (await kv()).get<T>(key);
  return (readLocal()[key] as T) ?? null;
}

export async function dbSet(key: string, value: unknown): Promise<void> {
  if (useKV()) { await (await kv()).set(key, value); return; }
  const db = readLocal();
  db[key] = value;
  writeLocal(db);
}

export async function dbDel(key: string): Promise<void> {
  if (useKV()) { await (await kv()).del(key); return; }
  const db = readLocal();
  delete db[key];
  writeLocal(db);
}

export async function dbSAdd(setKey: string, ...members: string[]): Promise<void> {
  if (useKV()) { await (await kv()).sadd(setKey, members[0], ...members.slice(1)); return; }
  const db = readLocal();
  const set = new Set<string>((db[setKey] as string[]) ?? []);
  members.forEach((m) => set.add(m));
  db[setKey] = Array.from(set);
  writeLocal(db);
}

export async function dbSMembers(setKey: string): Promise<string[]> {
  if (useKV()) return (await kv()).smembers(setKey);
  return (readLocal()[setKey] as string[]) ?? [];
}

export async function dbSRem(setKey: string, ...members: string[]): Promise<void> {
  if (useKV()) { await (await kv()).srem(setKey, ...members); return; }
  const db = readLocal();
  const set = new Set<string>((db[setKey] as string[]) ?? []);
  members.forEach((m) => set.delete(m));
  db[setKey] = Array.from(set);
  writeLocal(db);
}
