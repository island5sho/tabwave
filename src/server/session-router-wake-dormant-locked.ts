import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { isDormantLocked } from '../sync/dormant-locked-sweeper';

const DEFAULT_DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function registerWakeDormantLockedRoute(
  router: Router,
  store: SessionStore
): void {
  router.post('/sessions/wake-dormant-locked', async (req, res) => {
    try {
      const sessions = await store.getAll();
      const woken = [];
      for (const session of sessions) {
        if (isDormantLocked(session, DEFAULT_DORMANT_THRESHOLD_MS)) {
          const updated = await store.update(session.id, { dormant: false });
          if (updated) woken.push(updated);
        }
      }
      res.json({ woken });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
