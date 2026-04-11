import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { TabSession } from '../types/session';

export function registerCleanRoute(router: Router, store: SessionStore): void {
  router.post('/clean', async (req: Request, res: Response) => {
    try {
      const { olderThan, archived, dryRun } = req.body as {
        olderThan?: number;
        archived?: boolean;
        dryRun?: boolean;
      };

      const allSessions: TabSession[] = await store.getAll();
      const now = Date.now();

      const targets = allSessions.filter((session) => {
        if (archived && !session.archived) return false;

        if (olderThan !== undefined) {
          const cutoff = now - olderThan * 24 * 60 * 60 * 1000;
          const lastUpdated = new Date(session.updatedAt).getTime();
          if (lastUpdated >= cutoff) return false;
        }

        if (!archived && olderThan === undefined) return false;

        return true;
      });

      const ids = targets.map((s) => s.id);

      if (dryRun) {
        return res.json({ previewed: ids, removed: [] });
      }

      for (const id of ids) {
        await store.delete(id);
      }

      return res.json({ removed: ids, previewed: [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
