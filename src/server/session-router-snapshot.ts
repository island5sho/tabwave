import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { TabSession } from '../types/session';
import { v4 as uuidv4 } from 'uuid';

export function registerSnapshotRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/:id/snapshots', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { label } = req.body as { label?: string };

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const snapshotId = `snapshot-${uuidv4()}`;
    const now = Date.now();

    const snapshot: TabSession = {
      ...session,
      id: snapshotId,
      name: label ? `${session.name} — ${label}` : `${session.name} (snapshot ${new Date(now).toISOString()})`,
      tags: [...(session.tags ?? []), 'snapshot'],
      createdAt: now,
      updatedAt: now,
    };

    await store.save(snapshot);
    return res.status(201).json(snapshot);
  });

  router.get('/sessions/:id/snapshots', async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const all = await store.list();
    const snapshots = all.filter(
      (s) =>
        s.tags?.includes('snapshot') &&
        s.name.startsWith(session.name.split(' — ')[0])
    );

    return res.json(snapshots);
  });
}
