import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDormantScheduled(session: Session, thresholdMs: number = DEFAULT_DORMANT_THRESHOLD_MS): boolean {
  if (!session.scheduledAt) return false;
  if (session.dormant) return false;
  const scheduledTime = new Date(session.scheduledAt).getTime();
  const now = Date.now();
  return now - scheduledTime > thresholdMs;
}

export function startDormantScheduledSweeper(
  store: SessionStore,
  intervalMs: number = DEFAULT_INTERVAL_MS,
  thresholdMs: number = DEFAULT_DORMANT_THRESHOLD_MS
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantScheduled(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
