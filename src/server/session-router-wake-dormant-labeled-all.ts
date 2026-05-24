import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantLabeledAllRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-labeled-all', async (req, res) => {
    try {
      const { label } = req.body as { label?: string };

      if (!label || typeof label !== 'string') {
        res.status(400).json({ error: 'label is required' });
        return;
      }

      const all = await store.getAll();
      const now = Date.now();
      const woken: string[] = [];

      for (const session of all) {
        const hasLabel =
          Array.isArray(session.labels) && session.labels.includes(label);
        if (!hasLabel) continue;

        const isDormant =
          session.dormantSince !== undefined && session.dormantSince !== null;
        if (!isDormant) continue;

        const updated = {
          ...session,
          dormantSince: undefined,
          updatedAt: now,
        };

        await store.save(updated);
        woken.push(session.id);
      }

      res.json({ woken, count: woken.length });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
