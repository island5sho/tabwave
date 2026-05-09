import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerProtectRoute(router: Router, store: SessionStore): void {
  router.patch('/:id/protect', async (req, res) => {
    const { id } = req.params;
    const { protected: isProtected } = req.body;

    if (typeof isProtected !== 'boolean') {
      return res.status(400).json({ error: '"protected" field must be a boolean.' });
    }

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: `Session "${id}" not found.` });
    }

    const updated = {
      ...session,
      protected: isProtected,
      updatedAt: new Date().toISOString(),
    };

    await store.save(updated);
    return res.json(updated);
  });
}
