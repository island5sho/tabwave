import request from 'supertest';
import express from 'express';
import { registerWakeDormantLabeledAllRoute } from '../session-router-wake-dormant-labeled-all';
import { SessionStore } from '../../storage/session-store';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    labels: [],
    ...overrides,
  } as TabSession;
}

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerWakeDormantLabeledAllRoute(router, store);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-labeled-all', () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    store = {
      getAll: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<SessionStore>;
  });

  it('returns 400 if label is missing', async () => {
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled-all')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/label is required/i);
  });

  it('wakes all dormant sessions with the given label', async () => {
    const s1 = makeSession({ id: 'a', labels: ['work'], dormantSince: 1000 } as any);
    const s2 = makeSession({ id: 'b', labels: ['work'], dormantSince: 2000 } as any);
    const s3 = makeSession({ id: 'c', labels: ['personal'] });
    const s4 = makeSession({ id: 'd', labels: ['work'] }); // not dormant

    store.getAll.mockResolvedValue([s1, s2, s3, s4]);
    store.save.mockResolvedValue(undefined as any);

    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled-all')
      .send({ label: 'work' });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.woken).toEqual(expect.arrayContaining(['a', 'b']));
    expect(store.save).toHaveBeenCalledTimes(2);
  });

  it('returns count 0 if no matching dormant sessions', async () => {
    store.getAll.mockResolvedValue([
      makeSession({ id: 'x', labels: ['other'] }),
    ]);
    store.save.mockResolvedValue(undefined as any);

    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled-all')
      .send({ label: 'work' });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.woken).toEqual([]);
  });

  it('returns 500 on store error', async () => {
    store.getAll.mockRejectedValue(new Error('db fail'));
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled-all')
      .send({ label: 'work' });
    expect(res.status).toBe(500);
  });
});
