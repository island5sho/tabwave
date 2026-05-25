import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantHighlighted(session: Session, thresholdMs: number): boolean {
  if (!session.highlighted) return false;
  if (!session.lastAccessedAt) return false;
  const age = Date.now() - new Date(session.lastAccessedAt).getTime();
  return age >= thresholdMs;
}

export function startDormantHighlightedSweeper(
  store: SessionStore,
  thresholdMs: number,
  intervalMs: number
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantHighlighted(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
