import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { validateSession } from '../utils/session-validator';
import { Session } from '../types/session';

export function createSessionRouter(store: SessionStore): Router {
  const router = Router();

  // GET /sessions - list all sessions
  router.get('/', (_req: Request, res: Response) => {
    const sessions = store.getAll();
    res.json({ sessions, count: sessions.length });
  });

  // GET /sessions/:id - get a single session
  router.get('/:id', (req: Request, res: Response) => {
    const session = store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  });

  // POST /sessions - create or replace a session
  router.post('/', (req: Request, res: Response) => {
    const body = req.body as Session;
    const errors = validateSession(body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid session', details: errors });
    }
    store.save(body);
    res.status(201).json({ success: true, id: body.id });
  });

  // PUT /sessions/:id - update an existing session
  router.put('/:id', (req: Request, res: Response) => {
    const existing = store.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const updated: Session = { ...existing, ...req.body, id: req.params.id };
    const errors = validateSession(updated);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid session', details: errors });
    }
    store.save(updated);
    res.json({ success: true, id: updated.id });
  });

  // DELETE /sessions/:id - remove a session
  router.delete('/:id', (req: Request, res: Response) => {
    const existed = store.delete(req.params.id);
    if (!existed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true });
  });

  return router;
}
