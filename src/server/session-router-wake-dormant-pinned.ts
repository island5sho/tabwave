import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantPinnedRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-pinned', async (req, res) => {
    try {
      const all = await store.getAll();
      const now = Date.now();
      const woken: string[] = [];

      for (const session of all) {
        if (session.pinned && session.dormant) {
          const updated = {
            ...session,
            dormant: false,
            dormantSince: undefined,
            updatedAt: now,
          };
          await store.save(updated);
          woken.push(session.id);
        }
      }

      res.json({ woken, count: woken.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to wake dormant pinned sessions' });
    }
  });
}
