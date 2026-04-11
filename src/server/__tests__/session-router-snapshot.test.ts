import request from 'supertest';
import express from 'express';
import { registerSnapshotRoute } from '../session-router-snapshot';
import { SessionStore } from '../../storage/session-store';
import { TabSession } from '../../types/session';

const mockSession: TabSession = {
  id: 'session-1',
  name: 'Work Session',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example', pinned: false },
  ],
  tags: [],
  createdAt: 1000,
  updatedAt: 2000,
};

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerSnapshotRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe('POST /sessions/:id/snapshots', () => {
  it('creates a snapshot of an existing session', async () => {
    const saved: TabSession[] = [];
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockImplementation((s: TabSession) => { saved.push(s); return Promise.resolve(); }),
    };
    const res = await request(buildApp(store))
      .post('/sessions/session-1/snapshots')
      .send({ label: 'before refactor' });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^snapshot-/);
    expect(res.body.tags).toContain('snapshot');
    expect(res.body.name).toContain('before refactor');
  });

  it('returns 404 when session not found', async () => {
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(null),
    };
    const res = await request(buildApp(store))
      .post('/sessions/missing/snapshots')
      .send({});

    expect(res.status).toBe(404);
  });
});

describe('GET /sessions/:id/snapshots', () => {
  it('returns snapshots that belong to the session', async () => {
    const snapshot: TabSession = { ...mockSession, id: 'snapshot-x', tags: ['snapshot'] };
    const store: Partial<SessionStore> = {
      get: jest.fn().mockResolvedValue(mockSession),
      list: jest.fn().mockResolvedValue([mockSession, snapshot]),
    };
    const res = await request(buildApp(store)).get('/sessions/session-1/snapshots');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s: TabSession) => s.id === 'snapshot-x')).toBe(true);
  });
});
