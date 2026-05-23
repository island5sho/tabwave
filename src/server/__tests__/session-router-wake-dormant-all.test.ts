import express from 'express';
import request from 'supertest';
import { registerWakeDormantAllRoute } from '../session-router-wake-dormant-all';
import { SessionStore } from '../../storage/session-store';

function makeSession(overrides: Partial<any> = {}): any {
  return {
    id: 'sess-1',
    name: 'test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'dormant',
    protected: false,
    frozen: false,
    ...overrides,
  };
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantAllRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-all', () => {
  it('wakes dormant sessions and returns result', async () => {
    const session = makeSession({ id: 'a', name: 'alpha' });
    const store: Partial<SessionStore> = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-all').send({});
    expect(res.status).toBe(200);
    expect(res.body.woken).toContain('alpha');
    expect(res.body.skipped).toHaveLength(0);
  });

  it('skips protected sessions without force', async () => {
    const session = makeSession({ id: 'b', name: 'beta', protected: true });
    const store: Partial<SessionStore> = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-all').send({ force: false });
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
    expect(res.body.skipped).toContain('beta');
  });

  it('wakes protected sessions when force=true', async () => {
    const session = makeSession({ id: 'c', name: 'gamma', protected: true });
    const store: Partial<SessionStore> = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-all').send({ force: true });
    expect(res.status).toBe(200);
    expect(res.body.woken).toContain('gamma');
  });

  it('ignores recently active sessions', async () => {
    const recentSession = makeSession({
      id: 'd',
      name: 'delta',
      updatedAt: new Date().toISOString(),
    });
    const store: Partial<SessionStore> = {
      getAll: jest.fn().mockResolvedValue([recentSession]),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-all').send({});
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
    expect(store.update).not.toHaveBeenCalled();
  });

  it('returns 500 on store error', async () => {
    const store: Partial<SessionStore> = {
      getAll: jest.fn().mockRejectedValue(new Error('db failure')),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-all').send({});
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('db failure');
  });
});
