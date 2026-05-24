import express from 'express';
import request from 'supertest';
import { registerWakeDormantProtectedRoute } from '../session-router-wake-dormant-protected';
import { SessionStore } from '../../storage/session-store';

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dormant: false,
    protected: false,
    ...overrides,
  };
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantProtectedRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-protected', () => {
  it('wakes dormant protected sessions', async () => {
    const s1 = makeSession({ id: 'a', dormant: true, protected: true });
    const s2 = makeSession({ id: 'b', dormant: false, protected: true });
    const store = {
      getAll: jest.fn().mockResolvedValue([s1, s2]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-protected');
    expect(res.status).toBe(200);
    expect(res.body.woken).toContain('a');
    expect(res.body.skipped).toContain('b');
    expect(store.update).toHaveBeenCalledWith('a', expect.objectContaining({ dormant: false }));
  });

  it('returns empty woken when no dormant protected sessions', async () => {
    const store = {
      getAll: jest.fn().mockResolvedValue([
        makeSession({ id: 'x', dormant: false, protected: false }),
      ]),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-protected');
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
  });

  it('returns 500 on store error', async () => {
    const store = {
      getAll: jest.fn().mockRejectedValue(new Error('DB failure')),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-protected');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB failure');
  });
});
