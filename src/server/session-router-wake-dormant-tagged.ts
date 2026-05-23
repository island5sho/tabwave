import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantTaggedResult } from '../cli/commands/wake-dormant-tagged';

export function registerWakeDormantTaggedRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-tagged', async (req: Request, res: Response) => {
    const { tag } = req.body as { tag?: string };

    if (!tag || typeof tag !== 'string') {
      res.status(400).json({ error: 'tag is required' });
      return;
    }

    try {
      const all = await store.getAll();
      const woken: string[] = [];
      const skipped: string[] = [];

      for (const session of all) {
        const hasDormant = session.dormant === true;
        const hasTag = Array.isArray(session.tags) && session.tags.includes(tag);

        if (hasDormant && hasTag) {
          const updated = { ...session, dormant: false, updatedAt: new Date().toISOString() };
          await store.save(updated);
          woken.push(session.id);
        } else if (!hasDormant && hasTag) {
          skipped.push(session.id);
        }
      }

      const result: WakeDormantTaggedResult = { woken, skipped, tag };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });
}
