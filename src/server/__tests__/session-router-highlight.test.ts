import express from 'express';
import request from 'supertest';
import { registerHighlightRoute } from '../session-router-highlight';
import { SessionStore } from '../../storage/session-store';

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerHighlightRoute(router, store);
  app.use('/sessions', router);
  return app;
}

function makeSession(overrides = {}) {
  return {
    id: 'sess1',
    name: 'Test',
    tabs: [
      { url: 'https://a.com', title: 'A', highlighted: false },
      { url: 'https://b.com', title: 'B', highlighted: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('POST /sessions/:id/highlight', () => {
  it('highlights the specified tab', async () => {
    const session = makeSession();
    const store = { get: jest.fn().mockResolvedValue(session), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app)
      .post('/sessions/sess1/highlight')
      .send({ tabIndex: 1 });

    expect(res.status).toBe(200);
    expect(res.body.tab.highlighted).toBe(true);
    expect(res.body.tab.title).toBe('B');
    expect(store.save).toHaveBeenCalled();
  });

  it('returns 404 when session not found', async () => {
    const store = { get: jest.fn().mockResolvedValue(null), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app)
      .post('/sessions/ghost/highlight')
      .send({ tabIndex: 0 });

    expect(res.status).toBe(404);
  });

  it('returns 400 for out-of-range tab index', async () => {
    const store = { get: jest.fn().mockResolvedValue(makeSession()), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app)
      .post('/sessions/sess1/highlight')
      .send({ tabIndex: 99 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid tabIndex type', async () => {
    const store = { get: jest.fn().mockResolvedValue(makeSession()), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app)
      .post('/sessions/sess1/highlight')
      .send({ tabIndex: 'bad' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /sessions/:id/highlight/:tabIndex', () => {
  it('removes highlight from a tab', async () => {
    const session = makeSession({
      tabs: [
        { url: 'https://a.com', title: 'A', highlighted: true },
      ],
    });
    const store = { get: jest.fn().mockResolvedValue(session), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app).delete('/sessions/sess1/highlight/0');

    expect(res.status).toBe(200);
    expect(res.body.tab.highlighted).toBe(false);
  });

  it('returns 404 when session not found', async () => {
    const store = { get: jest.fn().mockResolvedValue(null), save: jest.fn() } as any;
    const app = buildApp(store);

    const res = await request(app).delete('/sessions/ghost/highlight/0');
    expect(res.status).toBe(404);
  });
});
