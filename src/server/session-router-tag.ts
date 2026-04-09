import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerTagRoute(router: Router, store: SessionStore): void {
  // PATCH /sessions/:id — partial update (supports tags, name, etc.)
  router.patch('/sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const session = await store.get(id);

      if (!session) {
        return res.status(404).json({ error: `Session not found: ${id}` });
      }

      const { tags, name } = req.body as { tags?: string[]; name?: string };

      if (tags !== undefined) {
        if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) {
          return res.status(400).json({ error: 'tags must be an array of strings' });
        }
        session.tags = tags;
      }

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ error: 'name must be a non-empty string' });
        }
        session.name = name.trim();
      }

      session.updatedAt = new Date().toISOString();
      await store.save(session);

      return res.json(session);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
