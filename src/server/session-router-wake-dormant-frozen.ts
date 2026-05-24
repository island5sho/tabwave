import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantFrozenResult } from '../cli/commands/wake-dormant-frozen';

export function registerWakeDormantFrozenRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-frozen', async (_req, res) => {
    try {
      const sessions = await store.list();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of sessions) {
        const isDormant = session.dormant === true;
        const isFrozen = session.frozen === true;

        if (isDormant && isFrozen) {
          await store.update(session.id, {
            dormant: false,
            dormantSince: undefined,
            frozen: false,
            updatedAt: new Date().toISOString(),
          });
          woken.push(session.id);
        } else {
          skipped.push(session.id);
        }
      }

      const result: WakeDormantFrozenResult = { woken, skipped };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
