import express from 'express';
import request from 'supertest';
import { registerWakeDormantPinnedRoute } from '../session-router-wake-dormant-pinned';
import { SessionStore } from '../../storage/session-store';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    name: 'Test',
    tabs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
    dormant: false,
    ...overrides,
  } as Session;
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantPinnedRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-pinned', () => {
  it('wakes dormant pinned sessions', async () => {
    const sessions = [
      makeSession({ id: 'a', pinned: true, dormant: true }),
      makeSession({ id: 'b', pinned: false, dormant: true }),
      makeSession({ id: 'c', pinned: true, dormant: false }),
    ];
    const saved: Session[] = [];
    const store = {
      getAll: jest.fn().mockResolvedValue(sessions),
      save: jest.fn().mockImplementation((s: Session) => { saved.push(s); return Promise.resolve(); }),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-pinned');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.woken).toContain('a');
    expect(saved[0].dormant).toBe(false);
  });

  it('returns empty when no dormant pinned sessions', async () => {
    const store = {
      getAll: jest.fn().mockResolvedValue([makeSession({ pinned: true, dormant: false })]),
      save: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-pinned');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.woken).toEqual([]);
  });

  it('returns 500 on store error', async () => {
    const store = {
      getAll: jest.fn().mockRejectedValue(new Error('fail')),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-pinned');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});
