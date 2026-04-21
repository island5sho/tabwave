import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerUnpinRoute(router: Router, store: SessionStore): void {
  router.patch('/sessions/:id/unpin', async (req, res) => {
    const { id } = req.params;

    const session = await store.getById(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (!session.pinned) {
      res.status(400).json({ error: 'Session is not pinned' });
      return;
    }

    const updated = { ...session, pinned: false, updatedAt: new Date().toISOString() };
    await store.save(updated);

    res.status(200).json(updated);
  });
}
