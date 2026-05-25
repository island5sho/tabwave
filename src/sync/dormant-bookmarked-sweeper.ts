import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantBookmarked(session: Session, thresholdMs: number): boolean {
  if (!session.bookmarked) return false;
  if (session.dormant) return false;
  const lastUpdated = new Date(session.updatedAt).getTime();
  return Date.now() - lastUpdated > thresholdMs;
}

export function startDormantBookmarkedSweeper(
  store: SessionStore,
  intervalMs = 60_000,
  thresholdMs = 7 * 24 * 60 * 60 * 1000
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantBookmarked(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
