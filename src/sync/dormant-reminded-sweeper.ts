import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function isDormantReminded(session: Session): boolean {
  return (
    session.dormant === true &&
    session.reminder !== undefined &&
    session.reminder !== null
  );
}

export function startDormantRemindedSweeper(
  store: SessionStore,
  intervalMs = 60_000
): NodeJS.Timeout {
  return setInterval(async () => {
    const sessions = await store.list();
    for (const session of sessions) {
      if (isDormantReminded(session)) {
        await store.save({
          ...session,
          dormant: false,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, intervalMs);
}
