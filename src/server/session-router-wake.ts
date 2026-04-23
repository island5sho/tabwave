import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeRoute(router: Router, store: SessionStore): void {
  router.post('/:id/wake', async (req, res) => {
    const { id } = req.params;

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isInactive =
      session.frozen === true ||
      session.status === 'dormant' ||
      session.status === 'frozen';

    if (!isInactive) {
      return res.status(409).json({ error: 'Session is already active' });
    }

    const now = new Date().toISOString();
    const updated = {
      ...session,
      frozen: false,
      status: 'active',
      wokeAt: now,
      updatedAt: now,
    };

    await store.save(updated);
    return res.status(200).json(updated);
  });
}
