import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { registerWatchRoute } from '../session-router-watch';
import { SessionStore } from '../../storage/session-store';

jest.mock('../../storage/session-store');

function buildApp(store: SessionStore) {
  const app = express();
  const router = Router();
  registerWatchRoute(router, store);
  app.use(router);
  return app;
}

describe('GET /sessions/watch (SSE)', () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    store = new (SessionStore as any)() as jest.Mocked<SessionStore>;
    store.list = jest.fn().mockReturnValue([
      {
        id: 'abc',
        name: 'test',
        tabs: [{ url: 'https://example.com', title: 'Example' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        archived: false,
        tags: [],
      },
    ]);
  });

  it('should respond with text/event-stream content type', (done) => {
    const app = buildApp(store);
    const req = request(app)
      .get('/sessions/watch')
      .expect('Content-Type', /text\/event-stream/)
      .buffer(true)
      .parse((res, callback) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
          if (data.includes('data:')) {
            callback(null, data);
            res.destroy();
          }
        });
        res.on('error', () => callback(null, data));
      });

    req.end((err, res) => {
      if (err && !String(err).includes('socket hang up')) return done(err);
      expect(res.text ?? res.body).toMatch(/data:/);
      done();
    });
  });

  it('should include session summaries in the SSE payload', (done) => {
    const app = buildApp(store);
    const req = request(app)
      .get('/sessions/watch')
      .buffer(true)
      .parse((res, callback) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
          if (data.includes('test')) {
            callback(null, data);
            res.destroy();
          }
        });
        res.on('error', () => callback(null, data));
      });

    req.end((err, res) => {
      if (err && !String(err).includes('socket hang up')) return done(err);
      expect(res.text ?? res.body).toMatch(/test/);
      done();
    });
  });
});
