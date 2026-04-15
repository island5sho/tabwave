import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { Schedule } from '../types/session';

const schedules: Map<string, Schedule> = new Map();

export function registerScheduleRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/:id/schedule', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cron, action } = req.body as { cron?: string; action?: string };

    if (!cron || !action) {
      return res.status(400).json({ error: 'cron and action are required' });
    }
    const validActions = ['push', 'pull', 'archive'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
    }

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const schedule: Schedule = { sessionId: id, cron, action, enabled: true };
    schedules.set(id, schedule);
    return res.status(200).json(schedule);
  });

  router.get('/schedules', (_req: Request, res: Response) => {
    return res.json(Array.from(schedules.values()));
  });

  router.delete('/sessions/:id/schedule', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!schedules.has(id)) {
      return res.status(404).json({ error: 'No schedule found for this session' });
    }
    schedules.delete(id);
    return res.status(200).json({ message: 'Schedule removed' });
  });
}

export { schedules };
