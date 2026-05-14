import express, { Express } from 'express';
import request from 'supertest';
import { registerPauseRoute } from '../session-router-pause';
import { SessionStore } from '../../storage/session-store';

function buildApp(store: SessionStore): Express {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerPauseRoute(router, store);
  app.use(router);
  return app;
}

function makeSession(overrides = {}) {
  return {
    id: 'abc123',
    name: 'Test Session',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paused: false,
    ...overrides,
  };
}

describe('PATCH /sessions/:id/pause', () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    store = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      all: jest.fn(),
    } as any;
  });

  it('returns 200 and marks session as paused', async () => {
    const session = makeSession();
    store.get.mockResolvedValue(session);
    store.set.mockResolvedValue(undefined);

    const res = await request(buildApp(store)).patch('/sessions/abc123/pause');
    expect(res.status).toBe(200);
    expect(res.body.paused).toBe(true);
    expect(res.body.pausedAt).toBeDefined();
  });

  it('returns 404 when session does not exist', async () => {
    store.get.mockResolvedValue(null);
    const res = await request(buildApp(store)).patch('/sessions/missing/pause');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('returns 409 when session is already paused', async () => {
    const session = makeSession({ paused: true });
    store.get.mockResolvedValue(session);
    const res = await request(buildApp(store)).patch('/sessions/abc123/pause');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Session is already paused');
  });

  it('persists the updated session via store.set', async () => {
    const session = makeSession();
    store.get.mockResolvedValue(session);
    store.set.mockResolvedValue(undefined);

    await request(buildApp(store)).patch('/sessions/abc123/pause');
    expect(store.set).toHaveBeenCalledWith('abc123', expect.objectContaining({ paused: true }));
  });
});
