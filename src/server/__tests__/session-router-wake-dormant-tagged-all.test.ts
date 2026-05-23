import express from 'express';
import request from 'supertest';
import { createSessionRouter } from '../session-router';
import { SessionStore } from '../../storage/session-store';
import { registerWakeDormantTaggedAllRoute } from '../session-router-wake-dormant-tagged-all';

function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 'sess-1',
    name: 'default',
    tabs: [],
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantTaggedAllRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-tagged-all', () => {
  it('returns 400 when tag is missing', async () => {
    const store = { list: jest.fn().mockResolvedValue([]), update: jest.fn() };
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-tagged-all')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('tag is required');
  });

  it('wakes matching dormant sessions with the given tag', async () => {
    const sessions = [
      makeSession({ id: 'a', name: 'alpha', tags: ['work'], dormantSince: 1000 }),
      makeSession({ id: 'b', name: 'beta', tags: ['personal'], dormantSince: 2000 }),
      makeSession({ id: 'c', name: 'gamma', tags: ['work'], dormantSince: undefined }),
    ];
    const store = {
      list: jest.fn().mockResolvedValue(sessions),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-tagged-all')
      .send({ tag: 'work' });
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe('work');
    expect(res.body.wokeCount).toBe(1);
    expect(res.body.sessionNames).toEqual(['alpha']);
    expect(store.update).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenCalledWith('a', expect.objectContaining({ dormantSince: undefined }));
  });

  it('returns wokeCount 0 when no dormant sessions match the tag', async () => {
    const sessions = [
      makeSession({ id: 'a', name: 'alpha', tags: ['work'], dormantSince: undefined }),
    ];
    const store = {
      list: jest.fn().mockResolvedValue(sessions),
      update: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-tagged-all')
      .send({ tag: 'work' });
    expect(res.status).toBe(200);
    expect(res.body.wokeCount).toBe(0);
    expect(res.body.sessionNames).toEqual([]);
    expect(store.update).not.toHaveBeenCalled();
  });
});
