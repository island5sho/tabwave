import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantTagged(session: Session, tag: string, thresholdMs: number): boolean {
  if (!session.tags || !session.tags.includes(tag)) return false;
  if (!session.dormantSince) return false;
  const dormantAge = Date.now() - new Date(session.dormantSince).getTime();
  return dormantAge >= thresholdMs;
}

export function startDormantTaggedSweeper(
  store: SessionStore,
  tag: string,
  thresholdMs: number,
  intervalMs: number
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantTagged(session, tag, thresholdMs)) {
        await store.save({
          ...session,
          status: 'dormant',
          dormantSince: session.dormantSince,
        });
      }
    }
  }, intervalMs);
}
