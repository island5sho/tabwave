import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { Session } from '../types/session';

export function registerDuplicateRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/:id/duplicate', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newName } = req.body as { newName?: string };

    if (!newName || typeof newName !== 'string' || newName.trim() === '') {
      return res.status(400).json({ error: 'newName is required and must be a non-empty string.' });
    }

    const original = await store.getById(id);
    if (!original) {
      return res.status(404).json({ error: `Session '${id}' not found.` });
    }

    const allSessions = await store.getAll();
    const nameConflict = allSessions.some(
      (s: Session) => s.name === newName.trim() && s.id !== id
    );
    if (nameConflict) {
      return res.status(409).json({ error: `A session named '${newName.trim()}' already exists.` });
    }

    const duplicated: Session = {
      ...original,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: newName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: original.tags ? [...original.tags] : [],
      tabs: original.tabs.map(tab => ({ ...tab })),
    };

    await store.save(duplicated);
    return res.status(201).json(duplicated);
  });
}
