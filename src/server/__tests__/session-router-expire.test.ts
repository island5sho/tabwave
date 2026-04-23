import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { registerExpireRoute } from '../session-router-expire';
import { SessionStore } from '../../storage/session-store';

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerExpireRoute(router, store);
  app.use('/sessions', router);
  return app;
}

const makeSession = (overrides = {}) => ({
  id: 's1',
  name: 'Test',
  tabs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('PATCH /sessions/:id/expire', () => {
  it('sets expiresAt on a session', async () => {
    const session = makeSession();
    const store = { get: jest.fn().mockResolvedValue(session), save: jest.fn().mockResolvedValue(undefined) } as any;
    const app = buildApp(store);
    const expiresAt = new Date(Date.now() + 60000).toISOString();
    const res = await request(app).patch('/sessions/s1/expire').send({ expiresAt });
    expect(res.status).toBe(200);
    expect(res.body.expiresAt).toBe(expiresAt);
    expect(store.save).toHaveBeenCalled();
  });

  it('returns 404 for unknown session', async () => {
    const store = { get: jest.fn().mockResolvedValue(null) } as any;
    const app = buildApp(store);
    const res = await request(app).patch('/sessions/bad/expire').send({ expiresAt: new Date().toISOString() });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid date', async () => {
    const store = { get: jest.fn().mockResolvedValue(makeSession()) } as any;
    const app = buildApp(store);
    const res = await request(app).patch('/sessions/s1/expire').send({ expiresAt: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('clears expiresAt when null is sent', async () => {
    const session = makeSession({ expiresAt: new Date().toISOString() });
    const store = { get: jest.fn().mockResolvedValue(session), save: jest.fn().mockResolvedValue(undefined) } as any;
    const app = buildApp(store);
    const res = await request(app).patch('/sessions/s1/expire').send({ expiresAt: null });
    expect(res.status).toBe(200);
    expect(res.body.expiresAt).toBeUndefined();
  });
});

describe('GET /sessions/expiring', () => {
  it('returns sessions expiring within the window', async () => {
    const soon = makeSession({ id: 's2', expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    const later = makeSession({ id: 's3', expiresAt: new Date(Date.now() + 200 * 60 * 1000).toISOString() });
    const store = { list: jest.fn().mockResolvedValue([soon, later]) } as any;
    const app = buildApp(store);
    const res = await request(app).get('/sessions/expiring?within=60');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('s2');
  });

  it('excludes sessions without expiresAt', async () => {
    const noExpiry = makeSession({ id: 's4' });
    const store = { list: jest.fn().mockResolvedValue([noExpiry]) } as any;
    const app = buildApp(store);
    const res = await request(app).get('/sessions/expiring');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
