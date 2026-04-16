import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { QuotaInfo } from '../cli/commands/quota';

const MAX_SESSIONS = 100;
const MAX_TABS = 5000;
const MAX_STORAGE_BYTES = 10 * 1024 * 1024; // 10MB

export function registerQuotaRoute(router: Router, store: SessionStore): void {
  router.get('/quota', async (_req, res) => {
    try {
      const sessions = await store.listSessions();
      const tabCount = sessions.reduce((sum, s) => sum + (s.tabs?.length ?? 0), 0);
      const storageBytes = Buffer.byteLength(JSON.stringify(sessions), 'utf8');

      const quota: QuotaInfo = {
        sessionCount: sessions.length,
        tabCount,
        maxSessions: MAX_SESSIONS,
        maxTabs: MAX_TABS,
        storageBytes,
        maxStorageBytes: MAX_STORAGE_BYTES,
      };

      res.json(quota);
    } catch {
      res.status(500).json({ error: 'Failed to compute quota' });
    }
  });
}
