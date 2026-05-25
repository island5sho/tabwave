import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { isDormantScheduled } from '../sync/dormant-scheduled-sweeper';

export function registerWakeDormantScheduledRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-scheduled', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const woken: string[] = [];
      for (const session of sessions) {
        if (session.dormant && session.scheduledAt && isDormantScheduled({ ...session, dormant: false })) {
          await store.update(session.id, { dormant: false });
          woken.push(session.id);
        }
      }
      res.json({ woken });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
