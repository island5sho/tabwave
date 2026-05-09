import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { v4 as uuidv4 } from 'uuid';

export function registerDetachRoute(router: Router, store: SessionStore): void {
  router.post('/:id/detach', async (req: Request, res: Response) => {
    const session = await store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { tabIndex, name } = req.body as { tabIndex: number; name?: string };

    if (typeof tabIndex !== 'number' || tabIndex < 0 || tabIndex >= session.tabs.length) {
      return res.status(400).json({ error: 'Invalid tabIndex' });
    }

    const [detachedTab] = session.tabs.splice(tabIndex, 1);
    session.updatedAt = new Date().toISOString();
    await store.save(session);

    const newSessionId = uuidv4();
    const newSession = {
      id: newSessionId,
      name: name ?? `Detached: ${detachedTab.title}`,
      tabs: [detachedTab],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      pinned: false,
      archived: false,
    };

    await store.save(newSession);

    return res.status(201).json({ newSessionId, tab: detachedTab });
  });
}
