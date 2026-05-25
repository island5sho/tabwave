import { SessionStore } from '../storage/session-store';

export interface DormantFrozenSweeperOptions {
  thresholdMs?: number;
  intervalMs?: number;
}

const DEFAULT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export interface DormantFrozenSweepResult {
  swept: string[];
  total: number;
}

export async function sweepDormantFrozen(
  store: SessionStore,
  thresholdMs: number = DEFAULT_THRESHOLD_MS
): Promise<DormantFrozenSweepResult> {
  const sessions = await store.getAll();
  const now = Date.now();
  const swept: string[] = [];

  for (const session of sessions) {
    if (!session.frozen) continue;
    if (session.dormant) continue;

    const lastActive = session.updatedAt
      ? new Date(session.updatedAt).getTime()
      : new Date(session.createdAt).getTime();

    if (now - lastActive >= thresholdMs) {
      await store.update(session.id, { dormant: true });
      swept.push(session.id);
    }
  }

  return { swept, total: swept.length };
}

export function startDormantFrozenSweeper(
  store: SessionStore,
  options: DormantFrozenSweeperOptions = {}
): NodeJS.Timeout {
  const { thresholdMs = DEFAULT_THRESHOLD_MS, intervalMs = DEFAULT_INTERVAL_MS } = options;

  return setInterval(async () => {
    try {
      await sweepDormantFrozen(store, thresholdMs);
    } catch (err) {
      console.error('[dormant-frozen-sweeper] Error during sweep:', err);
    }
  }, intervalMs);
}
