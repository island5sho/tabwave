import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantArchivedRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-archived', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of sessions) {
        const isDormant = session.dormant === true;
        const isArchived = session.archived === true;

        if (isDormant && isArchived) {
          const updated = {
            ...session,
            dormant: false,
            dormantSince: undefined,
            updatedAt: new Date().toISOString(),
          };
          await store.save(updated);
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
