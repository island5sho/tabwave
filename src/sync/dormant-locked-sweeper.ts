import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface DormantLockedSweeperOptions {
  intervalMs?: number;
  dormantThresholdMs?: number;
}

export function isDormantLocked(session: Session, thresholdMs: number): boolean {
  if (!session.locked) return false;
  const lastActive = session.updatedAt ?? session.createdAt;
  return Date.now() - new Date(lastActive).getTime() > thresholdMs;
}

export function startDormantLockedSweeper(
  store: SessionStore,
  options: DormantLockedSweeperOptions = {}
): NodeJS.Timeout {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const thresholdMs = options.dormantThresholdMs ?? DEFAULT_DORMANT_THRESHOLD_MS;

  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantLocked(session, thresholdMs)) {
        await store.update(session.id, { dormant: true });
      }
    }
  }, intervalMs);
}
