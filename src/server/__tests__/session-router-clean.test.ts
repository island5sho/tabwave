import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { registerCleanRoute } from '../session-router-clean';
import { SessionStore } from '../../storage/session-store';

const buildApp = (store: Partial<SessionStore>) => {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerCleanRoute(router, store as SessionStore);
  app.use('/sessions', router);
  return app;
};

const makeSession = (id: string, daysAgo: number, archived = false) => ({
  id,
  name: `Session ${id}`,
  tabs: [],
  archived,
  updatedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  createdAt: new Date().toISOString(),
});

test('removes archived sessions', async () => {
  const sessions = [makeSession('a1', 1, true), makeSession('a2', 1, false)];
  const store = {
    getAll: jest.fn().mockResolvedValue(sessions),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const res = await request(buildApp(store))
    .post('/sessions/clean')
    .send({ archived: true });

  expect(res.status).toBe(200);
  expect(res.body.removed).toEqual(['a1']);
  expect(store.delete).toHaveBeenCalledWith('a1');
  expect(store.delete).not.toHaveBeenCalledWith('a2');
});

test('dry-run returns previewed without deleting', async () => {
  const sessions = [makeSession('b1', 40, true)];
  const store = {
    getAll: jest.fn().mockResolvedValue(sessions),
    delete: jest.fn(),
  };

  const res = await request(buildApp(store))
    .post('/sessions/clean')
    .send({ archived: true, dryRun: true });

  expect(res.status).toBe(200);
  expect(res.body.previewed).toEqual(['b1']);
  expect(store.delete).not.toHaveBeenCalled();
});

test('removes sessions older than N days', async () => {
  const sessions = [makeSession('c1', 10, false), makeSession('c2', 40, false)];
  const store = {
    getAll: jest.fn().mockResolvedValue(sessions),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const res = await request(buildApp(store))
    .post('/sessions/clean')
    .send({ olderThan: 30 });

  expect(res.status).toBe(200);
  expect(res.body.removed).toEqual(['c2']);
});

test('returns 500 on store error', async () => {
  const store = { getAll: jest.fn().mockRejectedValue(new Error('DB error')) };

  const res = await request(buildApp(store))
    .post('/sessions/clean')
    .send({ archived: true });

  expect(res.status).toBe(500);
  expect(res.body.error).toBe('DB error');
});
