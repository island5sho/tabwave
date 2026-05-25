import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { isDormantAnnotated } from '../sync/dormant-annotated-sweeper';

export function registerWakeDormantAnnotatedRoute(
  router: Router,
  store: SessionStore
): void {
  router.post('/sessions/wake-dormant-annotated', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const woken: string[] = [];

      for (const session of sessions) {
        if (isDormantAnnotated(session)) {
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
