import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { SessionTab } from '../types/session';

export function registerCopyRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/copy', async (req: Request, res: Response) => {
    const { source, target, indices } = req.body as {
      source: string;
      target: string;
      indices?: number[];
    };

    if (!source || !target) {
      return res.status(400).json({ error: 'source and target are required' });
    }

    const srcSession = await store.getByIdOrName(source);
    if (!srcSession) {
      return res.status(404).json({ error: `Source session "${source}" not found` });
    }

    const tgtSession = await store.getByIdOrName(target);
    if (!tgtSession) {
      return res.status(404).json({ error: `Target session "${target}" not found` });
    }

    let tabsToCopy: SessionTab[];
    if (indices && indices.length > 0) {
      tabsToCopy = indices
        .filter((i) => i >= 0 && i < srcSession.tabs.length)
        .map((i) => ({ ...srcSession.tabs[i] }));
    } else {
      tabsToCopy = srcSession.tabs.map((t) => ({ ...t }));
    }

    if (tabsToCopy.length === 0) {
      return res.status(400).json({ error: 'No valid tabs to copy' });
    }

    tgtSession.tabs = [...tgtSession.tabs, ...tabsToCopy];
    tgtSession.updatedAt = new Date().toISOString();

    await store.save(tgtSession);

    return res.json({ copied: tabsToCopy.length, targetSession: tgtSession });
  });
}
