import express from 'express';
import request from 'supertest';
import { registerWakeDormantFavoritedRoute } from '../session-router-wake-dormant-favorited';
import { SessionStore } from '../../storage/session-store';

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dormant: false,
    favorite: false,
    ...overrides,
  };
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantFavoritedRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-favorited', () => {
  it('wakes dormant favorited sessions', async () => {
    const sessions = [
      makeSession({ id: 'a', dormant: true, favorite: true }),
      makeSession({ id: 'b', dormant: false, favorite: true }),
      makeSession({ id: 'c', dormant: true, favorite: false }),
    ];
    const store = {
      getAll: jest.fn().mockResolvedValue(sessions),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-favorited');
    expect(res.status).toBe(200);
    expect(res.body.woken).toEqual(['a']);
    expect(res.body.skipped).toEqual(expect.arrayContaining(['b', 'c']));
    expect(store.update).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenCalledWith('a', expect.objectContaining({ dormant: false }));
  });

  it('returns empty woken when no dormant favorited sessions', async () => {
    const store = {
      getAll: jest.fn().mockResolvedValue([makeSession({ dormant: false, favorite: false })]),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-favorited');
    expect(res.status).toBe(200);
    expect(res.body.woken).toHaveLength(0);
  });

  it('returns 500 on store error', async () => {
    const store = {
      getAll: jest.fn().mockRejectedValue(new Error('db fail')),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-favorited');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('db fail');
  });
});
