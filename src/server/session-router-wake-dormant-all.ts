import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantAllResult } from '../cli/commands/wake-dormant-all';

const DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function registerWakeDormantAllRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-all', async (req: Request, res: Response) => {
    try {
      const force: boolean = req.body?.force === true;
      const sessions = await store.getAll();
      const now = Date.now();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of sessions) {
        const lastActive = new Date(session.updatedAt).getTime();
        const isDormant = now - lastActive >= DORMANT_THRESHOLD_MS;
        if (!isDormant) continue;

        if (!force && (session.protected || session.frozen)) {
          skipped.push(session.name);
          continue;
        }

        await store.update(session.id, {
          ...session,
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
        woken.push(session.name);
      }

      const result: WakeDormantAllResult = { woken, skipped };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
