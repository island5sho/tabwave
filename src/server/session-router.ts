import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { validateSession } from '../utils/session-validator';

export function createSessionRouter(store: SessionStore): Router {
  const router = Router();

  // GET /sessions — list all sessions
  router.get('/', (_req: Request, res: Response) => {
    const sessions = store.getAll();
    res.json(sessions);
  });

  // GET /sessions/:id — get a single session
  router.get('/:id', (req: Request, res: Response) => {
    const session = store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  });

  // POST /sessions — create or replace a session
  router.post('/', (req: Request, res: Response) => {
    const result = validateSession(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid session', details: result.errors });
    }
    store.save(req.body);
    res.status(201).json(req.body);
  });

  // PUT /sessions/:id — update an existing session
  router.put('/:id', (req: Request, res: Response) => {
    const existing = store.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const result = validateSession(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid session', details: result.errors });
    }
    store.save({ ...req.body, id: req.params.id });
    res.json({ ...req.body, id: req.params.id });
  });

  // DELETE /sessions/:id — remove a session
  router.delete('/:id', (req: Request, res: Response) => {
    const existing = store.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }
    store.delete(req.params.id);
    res.status(204).send();
  });

  return router;
}
