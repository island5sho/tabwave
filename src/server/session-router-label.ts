import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerLabelRoute(router: Router, store: SessionStore): void {
  router.patch('/sessions/:id/labels', async (req, res) => {
    const { id } = req.params;
    const { add, remove } = req.body as { add?: string[]; remove?: string[] };

    if (!Array.isArray(add) && !Array.isArray(remove)) {
      return res.status(400).json({ error: 'Request body must include at least one of: add, remove' });
    }

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const current: string[] = session.labels ?? [];

    const addSet = new Set(current);

    if (Array.isArray(add)) {
      for (const label of add) {
        const trimmed = label.trim();
        if (trimmed) addSet.add(trimmed);
      }
    }

    if (Array.isArray(remove)) {
      for (const label of remove) {
        addSet.delete(label.trim());
      }
    }

    const updated = { ...session, labels: Array.from(addSet) };
    await store.save(updated);

    return res.json(updated);
  });
}
