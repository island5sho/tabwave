import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerDeactivateRoute(router: Router, store: SessionStore): void {
  router.patch('/:id/deactivate', async (req: Request, res: Response) => {
    const { id } = req.params;

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: `Session not found: ${id}` });
    }

    if (session.active === false) {
      return res.status(409).json({ error: 'Session is already inactive' });
    }

    const updated = {
      ...session,
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await store.save(updated);

    return res.status(200).json(updated);
  });
}
