import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { groupSessions } from '../cli/commands/group';

export function registerGroupRoute(router: Router, store: SessionStore): void {
  router.get('/sessions/group/:by', (req, res) => {
    const { by } = req.params;
    const validFields = ['tag', 'device', 'date'];

    if (!validFields.includes(by)) {
      return res.status(400).json({
        error: `Invalid group field: "${by}". Must be one of: ${validFields.join(', ')}`,
      });
    }

    const sessions = store.getAll();
    const grouped = groupSessions(sessions, by as 'tag' | 'device' | 'date');
    return res.json(grouped);
  });
}
