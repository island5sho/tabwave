import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

const DEFAULT_DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDormantLabeled(session: Session, thresholdMs = DEFAULT_DORMANT_THRESHOLD_MS): boolean {
  if (!session.label || session.label.trim() === '') return false;
  if (session.dormant) return false;
  const lastUpdated = new Date(session.updatedAt).getTime();
  return Date.now() - lastUpdated > thresholdMs;
}

export function startDormantLabeledSweeper(
  store: SessionStore,
  intervalMs = 60_000,
  thresholdMs = DEFAULT_DORMANT_THRESHOLD_MS
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantLabeled(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
