import { TabSession } from '../types/session';
import { readSessions, SessionStore } from './session-store';

export async function listSessions(storeDir?: string): Promise<TabSession[]> {
  const store: SessionStore = await readSessions(storeDir);
  return Object.values(store.sessions).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function findSessionsByDevice(
  deviceId: string,
  storeDir?: string
): Promise<TabSession[]> {
  const sessions = await listSessions(storeDir);
  return sessions.filter((s) => s.deviceId === deviceId);
}

export async function findSessionByName(
  name: string,
  storeDir?: string
): Promise<TabSession | null> {
  const sessions = await listSessions(storeDir);
  return sessions.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function summarizeSession(session: TabSession): string {
  const tabCount = session.tabs.length;
  const pinned = session.tabs.filter((t) => t.pinned).length;
  return [
    `[${session.id}] ${session.name}`,
    `  Device : ${session.deviceId}`,
    `  Tabs   : ${tabCount} (${pinned} pinned)`,
    `  Updated: ${new Date(session.updatedAt).toLocaleString()}`,
  ].join('\n');
}

export function mergeSessionTabs(
  base: TabSession,
  incoming: TabSession
): TabSession {
  const existingUrls = new Set(base.tabs.map((t) => t.url));
  const newTabs = incoming.tabs.filter((t) => !existingUrls.has(t.url));
  return {
    ...base,
    tabs: [...base.tabs, ...newTabs],
    updatedAt: new Date().toISOString(),
  };
}
