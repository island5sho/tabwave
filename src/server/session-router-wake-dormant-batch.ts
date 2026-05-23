import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantBatchResult } from '../cli/commands/wake-dormant-batch';

export function registerWakeDormantBatchRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-batch', async (req, res) => {
    const { ids } = req.body as { ids?: unknown };

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const result: WakeDormantBatchResult = { woken: [], skipped: [], failed: [] };

    for (const id of ids) {
      if (typeof id !== 'string') {
        result.failed.push(String(id));
        continue;
      }
      try {
        const session = await store.get(id);
        if (!session) {
          result.failed.push(id);
          continue;
        }
        if (!session.dormant) {
          result.skipped.push(id);
          continue;
        }
        const updated = { ...session, dormant: false, updatedAt: new Date().toISOString() };
        await store.save(updated);
        result.woken.push(id);
      } catch {
        result.failed.push(id);
      }
    }

    return res.json(result);
  });
}
