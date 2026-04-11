import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { generateShareToken, verifyShareToken } from '../utils/share-token';

export function registerShareRoutes(router: Router, store: SessionStore): void {
  // POST /sessions/:id/share — generate a share token
  router.post('/sessions/:id/share', (req: Request, res: Response) => {
    const session = store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const ttl = typeof req.body.ttl === 'number' ? req.body.ttl : 3600;
    const readonly = req.body.readonly === true;
    const expiresAt = Date.now() + ttl * 1000;

    const token = generateShareToken({
      sessionId: session.id,
      expiresAt,
      readonly,
    });

    return res.status(201).json({ token, expiresAt, readonly });
  });

  // GET /shared/:token — retrieve session via share token
  router.get('/shared/:token', (req: Request, res: Response) => {
    const payload = verifyShareToken(req.params.token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired share token' });
    }

    const session = store.get(payload.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session, readonly: payload.readonly });
  });
}
