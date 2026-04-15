import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { registerScheduleRoute, schedules } from '../session-router-schedule';
import { SessionStore } from '../../storage/session-store';

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerScheduleRoute(router, store);
  app.use(router);
  return app;
}

const mockSession = { id: 's1', name: 'Test', tabs: [], createdAt: '', updatedAt: '' };

describe('POST /sessions/:id/schedule', () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    schedules.clear();
    store = { get: jest.fn(), set: jest.fn(), list: jest.fn(), delete: jest.fn() } as any;
  });

  it('creates a schedule successfully', async () => {
    store.get.mockResolvedValue(mockSession as any);
    const app = buildApp(store);
    const res = await request(app)
      .post('/sessions/s1/schedule')
      .send({ cron: '0 9 * * 1', action: 'push' });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('s1');
    expect(res.body.cron).toBe('0 9 * * 1');
    expect(res.body.enabled).toBe(true);
  });

  it('returns 400 if cron missing', async () => {
    store.get.mockResolvedValue(mockSession as any);
    const app = buildApp(store);
    const res = await request(app).post('/sessions/s1/schedule').send({ action: 'push' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid action', async () => {
    store.get.mockResolvedValue(mockSession as any);
    const app = buildApp(store);
    const res = await request(app).post('/sessions/s1/schedule').send({ cron: '* * * * *', action: 'fly' });
    expect(res.status).toBe(400);
  });

  it('returns 404 if session not found', async () => {
    store.get.mockResolvedValue(null as any);
    const app = buildApp(store);
    const res = await request(app).post('/sessions/s1/schedule').send({ cron: '* * * * *', action: 'push' });
    expect(res.status).toBe(404);
  });
});

describe('GET /schedules', () => {
  it('returns all schedules', async () => {
    schedules.clear();
    const store = { get: jest.fn() } as any;
    schedules.set('s1', { sessionId: 's1', cron: '* * * * *', action: 'pull', enabled: true });
    const app = buildApp(store);
    const res = await request(app).get('/schedules');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].sessionId).toBe('s1');
  });
});

describe('DELETE /sessions/:id/schedule', () => {
  it('removes an existing schedule', async () => {
    schedules.clear();
    schedules.set('s1', { sessionId: 's1', cron: '* * * * *', action: 'push', enabled: true });
    const store = {} as any;
    const app = buildApp(store);
    const res = await request(app).delete('/sessions/s1/schedule');
    expect(res.status).toBe(200);
    expect(schedules.has('s1')).toBe(false);
  });

  it('returns 404 if no schedule exists', async () => {
    schedules.clear();
    const store = {} as any;
    const app = buildApp(store);
    const res = await request(app).delete('/sessions/s1/schedule');
    expect(res.status).toBe(404);
  });
});
