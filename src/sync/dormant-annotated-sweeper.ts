import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantAnnotated(session: Session): boolean {
  return (
    session.dormant === true &&
    typeof session.annotation === 'string' &&
    session.annotation.trim().length > 0
  );
}

export function startDormantAnnotatedSweeper(
  store: SessionStore,
  intervalMs: number = 60_000
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.getAll();
    for (const session of sessions) {
      if (isDormantAnnotated(session)) {
        await store.save({
          ...session,
          dormant: false,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, intervalMs);
}
