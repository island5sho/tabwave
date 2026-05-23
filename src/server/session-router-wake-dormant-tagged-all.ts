import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { WakeDormantTaggedAllResult } from '../cli/commands/wake-dormant-tagged-all';

export function registerWakeDormantTaggedAllRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-tagged-all', async (req: Request, res: Response) => {
    const { tag } = req.body as { tag?: string };
    if (!tag || typeof tag !== 'string') {
      return res.status(400).json({ error: 'tag is required' });
    }

    const sessions = await store.list();
    const now = Date.now();
    const sessionNames: string[] = [];

    for (const session of sessions) {
      const isDormant = session.dormantSince !== undefined && session.dormantSince !== null;
      const hasTag = Array.isArray(session.tags) && session.tags.includes(tag);
      if (isDormant && hasTag) {
        await store.update(session.id, {
          dormantSince: undefined,
          updatedAt: now,
        });
        sessionNames.push(session.name);
      }
    }

    const result: WakeDormantTaggedAllResult = {
      tag,
      wokeCount: sessionNames.length,
      sessionNames,
    };
    return res.json(result);
  });
}
