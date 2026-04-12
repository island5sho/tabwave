import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { registerGroupRoute } from '../session-router-group';
import { SessionStore } from '../../storage/session-store';
import { TabSession } from '../../types/session';

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerGroupRoute(router, store);
  app.use(router);
  return app;
}

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    tags: ['work'],
    device: 'laptop',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T10:00:00.000Z',
    pinned: false,
    locked: false,
    archived: false,
    ...overrides,
  };
}

describe('GET /sessions/group/:by', () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    store = { getAll: jest.fn() } as unknown as jest.Mocked<SessionStore>;
  });

  it('returns 400 for invalid group field', async () => {
    store.getAll.mockReturnValue([]);
    const app = buildApp(store);
    const res = await request(app).get('/sessions/group/invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid group field/);
  });

  it('groups sessions by tag', async () => {
    store.getAll.mockReturnValue([
      makeSession({ id: 'a', tags: ['work'] }),
      makeSession({ id: 'b', tags: ['personal'] }),
    ]);
    const app = buildApp(store);
    const res = await request(app).get('/sessions/group/tag');
    expect(res.status).toBe(200);
    expect(res.body['work']).toHaveLength(1);
    expect(res.body['personal']).toHaveLength(1);
  });

  it('groups sessions by device', async () => {
    store.getAll.mockReturnValue([
      makeSession({ id: 'a', device: 'laptop' }),
      makeSession({ id: 'b', device: 'desktop' }),
    ]);
    const app = buildApp(store);
    const res = await request(app).get('/sessions/group/device');
    expect(res.status).toBe(200);
    expect(res.body['laptop']).toHaveLength(1);
    expect(res.body['desktop']).toHaveLength(1);
  });

  it('groups sessions by date', async () => {
    store.getAll.mockReturnValue([
      makeSession({ id: 'a', updatedAt: '2024-06-01T08:00:00.000Z' }),
      makeSession({ id: 'b', updatedAt: '2024-06-01T20:00:00.000Z' }),
    ]);
    const app = buildApp(store);
    const res = await request(app).get('/sessions/group/date');
    expect(res.status).toBe(200);
    expect(res.body['2024-06-01']).toHaveLength(2);
  });

  it('returns empty grouped object when no sessions', async () => {
    store.getAll.mockReturnValue([]);
    const app = buildApp(store);
    const res = await request(app).get('/sessions/group/tag');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});
