import { Session } from '../types/session';
import { SessionStore } from '../storage/session-store';
import { mergeSessionTabs } from '../storage/session-store-helpers';
import { diffSessions, hasDiff, applyDiff, SessionDiff } from './session-diff';

export type SyncStrategy = 'local-wins' | 'remote-wins' | 'merge';

export interface SyncResult {
  strategy: SyncStrategy;
  diff: SessionDiff;
  merged: Session;
  conflicted: boolean;
}

export async function syncSessions(
  store: SessionStore,
  sessionId: string,
  remote: Session,
  strategy: SyncStrategy = 'merge'
): Promise<SyncResult> {
  const local = await store.getSession(sessionId);

  if (!local) {
    await store.saveSession(remote);
    return {
      strategy,
      diff: { added: remote.tabs, removed: [], updated: [], unchanged: [] },
      merged: remote,
      conflicted: false,
    };
  }

  const diff = diffSessions(local, remote);
  const conflicted = hasDiff(diff);

  let merged: Session;

  switch (strategy) {
    case 'local-wins':
      merged = local;
      break;
    case 'remote-wins':
      merged = remote;
      break;
    case 'merge':
    default:
      merged = mergeSessionTabs(local, remote);
      break;
  }

  if (conflicted || strategy !== 'local-wins') {
    await store.saveSession(merged);
  }

  return { strategy, diff, merged, conflicted };
}
