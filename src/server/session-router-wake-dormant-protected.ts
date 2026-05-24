import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantProtectedRoute(
  router: Router,
  store: SessionStore
): void {
  router.post('/sessions/wake-dormant-protected', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of sessions) {
        if (session.dormant && session.protected) {
          await store.update(session.id, {
            dormant: false,
            updatedAt: new Date().toISOString(),
          });
          woken.push(session.id);
        } else {
          skipped.push(session.id);
        }
      }

      res.json({ woken, skipped });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
