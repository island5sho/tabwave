import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { isDormantReminded } from '../sync/dormant-reminded-sweeper';

export function registerWakeDormantRemindedRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-reminded', async (_req, res) => {
    try {
      const sessions = await store.list();
      const woken: string[] = [];
      for (const session of sessions) {
        if (isDormantReminded(session)) {
          await store.save({
            ...session,
            dormant: false,
            updatedAt: new Date().toISOString()
          });
          woken.push(session.id);
        }
      }
      res.json({ woken });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
