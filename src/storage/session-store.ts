import fs from 'fs/promises';
import path from 'path';
import { TabSession } from '../types/session';

const DEFAULT_STORE_DIR = path.join(process.env.HOME || '~', '.tabwave');
const SESSIONS_FILE = 'sessions.json';

export interface SessionStore {
  sessions: Record<string, TabSession>;
  lastUpdated: string;
}

export async function ensureStoreDir(storeDir: string = DEFAULT_STORE_DIR): Promise<void> {
  await fs.mkdir(storeDir, { recursive: true });
}

export async function readSessions(storeDir: string = DEFAULT_STORE_DIR): Promise<SessionStore> {
  const filePath = path.join(storeDir, SESSIONS_FILE);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as SessionStore;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return { sessions: {}, lastUpdated: new Date().toISOString() };
    }
    if (err instanceof SyntaxError) {
      throw new Error(`Sessions store is corrupted (invalid JSON): ${err.message}`);
    }
    throw new Error(`Failed to read sessions store: ${err.message}`);
  }
}

export async function writeSessions(
  store: SessionStore,
  storeDir: string = DEFAULT_STORE_DIR
): Promise<void> {
  await ensureStoreDir(storeDir);
  const filePath = path.join(storeDir, SESSIONS_FILE);
  const updated: SessionStore = { ...store, lastUpdated: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
}

export async function upsertSession(
  session: TabSession,
  storeDir: string = DEFAULT_STORE_DIR
): Promise<void> {
  const store = await readSessions(storeDir);
  store.sessions[session.id] = session;
  await writeSessions(store, storeDir);
}

export async function deleteSession(
  sessionId: string,
  storeDir: string = DEFAULT_STORE_DIR
): Promise<boolean> {
  const store = await readSessions(storeDir);
  if (!store.sessions[sessionId]) return false;
  delete store.sessions[sessionId];
  await writeSessions(store, storeDir);
  return true;
}

export async function getSession(
  sessionId: string,
  storeDir: string = DEFAULT_STORE_DIR
): Promise<TabSession | null> {
  const store = await readSessions(storeDir);
  return store.sessions[sessionId] ?? null;
}

/**
 * Returns all sessions as an array, optionally sorted by creation date descending.
 */
export async function listSessions(
  storeDir: string = DEFAULT_STORE_DIR,
  sortByCreatedDesc = true
): Promise<TabSession[]> {
  const store = await readSessions(storeDir);
  const sessions = Object.values(store.sessions);
  if (sortByCreatedDesc) {
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sessions;
}
