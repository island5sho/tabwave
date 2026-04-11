import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { diffSessions } from '../sync/session-diff';

export function registerDiffRoute(router: Router, store: SessionStore): void {
  // Returns a diff object between the stored session and a provided session body
  router.post('/sessions/:id/diff', (req, res) => {
    const { id } = req.params;
    const remoteSession = req.body;

    if (!remoteSession || !remoteSession.tabs) {
      return res.status(400).json({ error: 'Invalid session body' });
    }

    const localSession = store.get(id);
    if (!localSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const diff = diffSessions(localSession, remoteSession);
    return res.json(diff);
  });

  // Returns the remote (stored) session for comparison
  router.get('/sessions/:id/remote', (req, res) => {
    const { id } = req.params;
    const session = store.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  });
}
