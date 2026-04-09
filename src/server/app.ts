import express, { Application } from 'express';
import { SessionStore } from '../storage/session-store';
import { createSessionRouter } from './session-router';

export interface AppOptions {
  store?: SessionStore;
  port?: number;
}

export function createApp(options: AppOptions = {}): Application {
  const app = express();
  const store = options.store ?? new SessionStore();

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Session routes
  app.use('/sessions', createSessionRouter(store));

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

export function startServer(options: AppOptions = {}): void {
  const port = options.port ?? 7654;
  const app = createApp(options);
  app.listen(port, () => {
    console.log(`[tabwave] Server running on http://localhost:${port}`);
  });
}
