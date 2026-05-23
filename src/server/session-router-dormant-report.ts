import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { buildDormantReport } from '../cli/commands/dormant-report';

export function registerDormantReportRoute(router: Router, store: SessionStore): void {
  router.get('/sessions/dormant-report', async (_req, res) => {
    try {
      const sessions = await store.getAll();
      const report = buildDormantReport(sessions);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate dormant report', detail: err.message });
    }
  });
}
