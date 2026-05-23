import express from 'express';
import request from 'supertest';
import { registerWakeDormantReportRoute } from '../session-router-wake-dormant-report';
import { SessionStore } from '../../storage/session-store';

function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function buildApp(sessions: any[]) {
  const store = {
    getAll: jest.fn().mockResolvedValue(sessions),
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as SessionStore;

  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantReportRoute(router, store);
  app.use(router);
  return { app, store };
}

describe('POST /sessions/wake-dormant-report', () => {
  it('wakes dormant sessions and returns result', async () => {
    const { app, store } = buildApp([makeSession()]);
    const res = await request(app).post('/sessions/wake-dormant-report');
    expect(res.status).toBe(200);
    expect(res.body.woken).toContain('sess-1');
    expect(res.body.skipped).toHaveLength(0);
    expect(store.save).toHaveBeenCalled();
  });

  it('skips locked sessions', async () => {
    const { app } = buildApp([makeSession({ locked: true })]);
    const res = await request(app).post('/sessions/wake-dormant-report');
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
    expect(res.body.skipped).toContain('sess-1');
  });

  it('skips protected sessions', async () => {
    const { app } = buildApp([makeSession({ protected: true })]);
    const res = await request(app).post('/sessions/wake-dormant-report');
    expect(res.body.skipped).toContain('sess-1');
  });

  it('ignores recently active sessions', async () => {
    const recent = makeSession({
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    const { app, store } = buildApp([recent]);
    const res = await request(app).post('/sessions/wake-dormant-report');
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
    expect(store.save).not.toHaveBeenCalled();
  });

  it('returns 500 on store error', async () => {
    const store = {
      getAll: jest.fn().mockRejectedValue(new Error('db fail')),
      save: jest.fn(),
    } as unknown as SessionStore;
    const app = express();
    const router = express.Router();
    registerWakeDormantReportRoute(router, store);
    app.use(router);
    const res = await request(app).post('/sessions/wake-dormant-report');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('db fail');
  });
});
