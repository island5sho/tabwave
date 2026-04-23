import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerExpireRoute(router: Router, store: SessionStore): void {
  // Set or clear expiry
  router.patch('/:id/expire', async (req, res) => {
    const session = await store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { expiresAt } = req.body as { expiresAt: string | null };

    if (expiresAt !== undefined && expiresAt !== null) {
      const parsed = new Date(expiresAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid expiresAt date' });
      }
      session.expiresAt = expiresAt;
    } else {
      delete session.expiresAt;
    }

    session.updatedAt = new Date().toISOString();
    await store.save(session);
    return res.json(session);
  });

  // List sessions that are expired or expiring soon (within next N minutes)
  router.get('/expiring', async (req, res) => {
    const withinMins = parseInt((req.query.within as string) ?? '60', 10);
    const sessions = await store.list();
    const now = Date.now();
    const threshold = now + withinMins * 60 * 1000;
    const expiring = sessions.filter((s) => {
      if (!s.expiresAt) return false;
      const t = new Date(s.expiresAt).getTime();
      return t <= threshold;
    });
    return res.json(expiring);
  });
}
