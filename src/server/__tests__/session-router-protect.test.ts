import express from 'express';
import request from 'supertest';
import { createSessionRouter } from '../session-router';
import { SessionStore } from '../../storage/session-store';

const makeSession = (overrides = {}) => ({
  id: 'abc123',
  name: 'Work',
  tabs: [],
  protected: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildApp = (store: Partial<SessionStore>) => {
  const app = express();
  app.use(express.json());
  app.use('/sessions', createSessionRouter(store as SessionStore));
  return app;
};

describe('PATCH /sessions/:id/protect', () => {
  it('sets protected to true', async () => {
    const session = makeSession();
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const res = await request(buildApp(store))
      .patch('/sessions/abc123/protect')
      .send({ protected: true });

    expect(res.status).toBe(200);
    expect(res.body.protected).toBe(true);
    expect(store.save).toHaveBeenCalled();
  });

  it('sets protected to false', async () => {
    const session = makeSession({ protected: true });
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const res = await request(buildApp(store))
      .patch('/sessions/abc123/protect')
      .send({ protected: false });

    expect(res.status).toBe(200);
    expect(res.body.protected).toBe(false);
  });

  it('returns 404 when session not found', async () => {
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    const res = await request(buildApp(store))
      .patch('/sessions/missing/protect')
      .send({ protected: true });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 when protected field is not boolean', async () => {
    const store: Partial<SessionStore> = {
      get: jest.fn(),
      save: jest.fn(),
    };

    const res = await request(buildApp(store))
      .patch('/sessions/abc123/protect')
      .send({ protected: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/boolean/i);
  });
});
