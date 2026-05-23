import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeAllExpiredResult } from '../cli/commands/wake-all-expired';

export function registerWakeAllExpiredRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-all-expired', async (_req, res) => {
    try {
      const all = await store.list();
      const now = Date.now();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of all) {
        if (!session.expiresAt) continue;
        if (session.expiresAt > now) continue;

        if (session.protected || session.frozen) {
          skipped.push(session.id);
          continue;
        }

        const updated = { ...session, expiresAt: undefined, updatedAt: now };
        await store.save(updated);
        woken.push(session.id);
      }

      const result: WakeAllExpiredResult = {
        woken,
        skipped,
        total: woken.length + skipped.length,
      };

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
