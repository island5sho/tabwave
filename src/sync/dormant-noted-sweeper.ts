import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantNoted(session: Session, thresholdMs: number): boolean {
  if (!session.note || session.dormant) return false;
  const lastUpdated = session.updatedAt ?? session.createdAt;
  if (!lastUpdated) return false;
  return Date.now() - new Date(lastUpdated).getTime() > thresholdMs;
}

export function startDormantNotedSweeper(
  store: SessionStore,
  intervalMs = 60_000,
  thresholdMs = 7 * 24 * 60 * 60 * 1000
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantNoted(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
