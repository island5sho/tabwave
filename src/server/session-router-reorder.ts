import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerReorderRoute(router: Router, store: SessionStore): void {
  router.post('/:id/reorder', async (req, res) => {
    const { id } = req.params;
    const { from, to } = req.body as { from: unknown; to: unknown };

    if (typeof from !== 'number' || typeof to !== 'number') {
      return res.status(400).json({ error: 'from and to must be numbers' });
    }

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const tabs = [...session.tabs];
    if (from < 0 || from >= tabs.length || to < 0 || to >= tabs.length) {
      return res.status(400).json({ error: 'Index out of range' });
    }

    const [moved] = tabs.splice(from, 1);
    tabs.splice(to, 0, moved);

    const updated = { ...session, tabs, updatedAt: new Date().toISOString() };
    await store.save(updated);

    return res.json({ tabs: updated.tabs });
  });
}
