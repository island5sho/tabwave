import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { registerWakeDormantLabeledRoute } from '../session-router-wake-dormant-labeled';
import { SessionStore } from '../../storage/session-store';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-1',
    name: 'Test Session',
    tabs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    labels: [],
    ...overrides,
  } as TabSession;
}

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerWakeDormantLabeledRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/wake-dormant-labeled', () => {
  it('returns 400 when label is missing', async () => {
    const store = { getAll: jest.fn().mockResolvedValue([]) };
    const app = buildApp(store);
    const res = await request(app).post('/sessions/wake-dormant-labeled').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/label is required/);
  });

  it('wakes dormant sessions matching the label', async () => {
    const dormant = makeSession({
      id: 'a',
      labels: ['work'],
      dormantSince: Date.now() - 10000,
    });
    const active = makeSession({
      id: 'b',
      labels: ['work'],
    });
    const otherLabel = makeSession({
      id: 'c',
      labels: ['personal'],
      dormantSince: Date.now() - 5000,
    });

    const saved: TabSession[] = [];
    const store = {
      getAll: jest.fn().mockResolvedValue([dormant, active, otherLabel]),
      save: jest.fn().mockImplementation((s: TabSession) => {
        saved.push(s);
        return Promise.resolve();
      }),
    };

    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled')
      .send({ label: 'work' });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.woken).toContain('a');
    expect(saved[0].dormantSince).toBeUndefined();
  });

  it('returns empty woken list when no sessions match', async () => {
    const session = makeSession({ id: 'x', labels: ['other'] });
    const store = {
      getAll: jest.fn().mockResolvedValue([session]),
      save: jest.fn(),
    };
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled')
      .send({ label: 'work' });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.woken).toHaveLength(0);
  });

  it('returns 500 on store error', async () => {
    const store = { getAll: jest.fn().mockRejectedValue(new Error('db error')) };
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/wake-dormant-labeled')
      .send({ label: 'work' });
    expect(res.status).toBe(500);
  });
});
