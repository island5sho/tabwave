import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerWakeDormantSinceRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/wake-dormant-since', async (req: Request, res: Response) => {
    const { since } = req.body as { since?: string };

    if (!since) {
      res.status(400).json({ error: '`since` date is required' });
      return;
    }

    const cutoff = new Date(since);
    if (isNaN(cutoff.getTime())) {
      res.status(400).json({ error: `Invalid date: ${since}` });
      return;
    }

    const sessions = await store.getAll();
    const woken: string[] = [];
    const skipped: string[] = [];

    for (const session of sessions) {
      const dormantSince = (session as any).dormantSince as string | undefined;
      if (!dormantSince) {
        skipped.push(session.id);
        continue;
      }
      const dormantDate = new Date(dormantSince);
      if (dormantDate >= cutoff) {
        const updated = { ...session, dormant: false, dormantSince: undefined } as any;
        delete updated.dormantSince;
        await store.save(updated);
        woken.push(session.id);
      } else {
        skipped.push(session.id);
      }
    }

    res.json({ woken, skipped });
  });
}
