import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerPauseRoute(router: Router, store: SessionStore): void {
  router.patch('/sessions/:id/pause', async (req: Request, res: Response) => {
    const { id } = req.params;

    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.paused) {
      res.status(409).json({ error: 'Session is already paused' });
      return;
    }

    const updated = {
      ...session,
      paused: true,
      pausedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.set(id, updated);
    res.status(200).json(updated);
  });
}
