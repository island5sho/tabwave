import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantReportResult } from '../cli/commands/wake-dormant-report';

const DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function registerWakeDormantReportRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-report', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const now = Date.now();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of sessions) {
        const lastActive = session.updatedAt
          ? new Date(session.updatedAt).getTime()
          : new Date(session.createdAt).getTime();
        const isDormant = now - lastActive > DORMANT_THRESHOLD_MS;

        if (!isDormant) continue;

        if (session.locked || session.protected) {
          skipped.push(session.id);
          continue;
        }

        const updated = {
          ...session,
          dormant: false,
          updatedAt: new Date().toISOString(),
        };
        await store.save(updated);
        woken.push(session.id);
      }

      const result: WakeDormantReportResult = {
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
