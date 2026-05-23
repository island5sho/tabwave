import express from 'express';
import request from 'supertest';
import { registerBounceRoute } from '../session-router-bounce';
import { SessionStore } from '../../storage/session-store';

const makeSession = (overrides = {}) => ({
  id: 'test-id',
  name: 'Test',
  tabs: [],
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const buildApp = (store: Partial<SessionStore>) => {
  const app = express();
  app.use(express.json());
  const router = express.Router({ mergeParams: true });
  registerBounceRoute(router, store as SessionStore);
  app.use('/sessions', router);
  return app;
};

describe('POST /sessions/:id/bounce', () => {
  it('returns bounced session with active: true', async () => {
    const session = makeSession();
    const store = {
      get: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const res = await request(buildApp(store))
      .post('/sessions/test-id/bounce')
      .query({ delay: '0' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session.active).toBe(true);
    // save should have been called twice (deactivate + reactivate)
    expect(store.save).toHaveBeenCalledTimes(2);
    expect(store.save.mock.calls[0][0].active).toBe(false);
    expect(store.save.mock.calls[1][0].active).toBe(true);
  });

  it('returns 404 when session does not exist', async () => {
    const store = {
      get: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    const res = await request(buildApp(store))
      .post('/sessions/ghost/bounce')
      .query({ delay: '0' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
    expect(store.save).not.toHaveBeenCalled();
  });
});
