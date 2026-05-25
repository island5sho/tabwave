import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { isDormantLabeled } from '../sync/dormant-labeled-sweeper';

export function registerWakeDormantLabeledSinceRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-labeled-since', async (req, res) => {
    const { since, label } = req.body as { since?: string; label?: string };
    if (!since) {
      return res.status(400).json({ error: 'Missing required field: since' });
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format for since' });
    }
    try {
      const sessions = await store.getAll();
      const woken: string[] = [];
      for (const session of sessions) {
        if (!session.dormant) continue;
        if (!session.label || session.label.trim() === '') continue;
        if (label && session.label !== label) continue;
        const updatedAt = new Date(session.updatedAt);
        if (updatedAt >= sinceDate) continue;
        await store.update(session.id, { dormant: false });
        woken.push(session.id);
      }
      return res.json({ woken });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
