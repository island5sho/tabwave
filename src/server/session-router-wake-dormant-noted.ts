import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantNotedRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/:id/wake-dormant-noted', async (req, res) => {
    try {
      const session = await store.get(req.params.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (!session.dormant) return res.status(400).json({ error: 'Session is not dormant' });
      if (!session.note) return res.status(400).json({ error: 'Session has no note' });
      const updated = await store.update(session.id, { dormant: false });
      res.json({ session: updated });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
