import request from 'supertest';
import { createApp } from '../app';
import { SessionStore } from '../../storage/session-store';
import { Session } from '../../types/session';

const mockSession: Session = {
  id: 'sess-001',
  deviceId: 'device-abc',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tabs: [
    { id: 'tab-1', url: 'https://example.com', title: 'Example', index: 0 }
  ]
};

describe('Session Router', () => {
  let store: SessionStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new SessionStore();
    app = createApp({ store });
  });

  describe('GET /sessions', () => {
    it('returns empty list when no sessions exist', async () => {
      const res = await request(app).get('/sessions');
      expect(res.status).toBe(200);
      expect(res.body.sessions).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('returns all saved sessions', async () => {
      store.save(mockSession);
      const res = await request(app).get('/sessions');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /sessions/:id', () => {
    it('returns 404 for unknown session', async () => {
      const res = await request(app).get('/sessions/unknown');
      expect(res.status).toBe(404);
    });

    it('returns the session when found', async () => {
      store.save(mockSession);
      const res = await request(app).get(`/sessions/${mockSession.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockSession.id);
    });
  });

  describe('POST /sessions', () => {
    it('creates a valid session', async () => {
      const res = await request(app).post('/sessions').send(mockSession);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(mockSession.id);
    });

    it('rejects an invalid session', async () => {
      const res = await request(app).post('/sessions').send({ id: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /sessions/:id', () => {
    it('deletes an existing session', async () => {
      store.save(mockSession);
      const res = await request(app).delete(`/sessions/${mockSession.id}`);
      expect(res.status).toBe(200);
      expect(store.get(mockSession.id)).toBeUndefined();
    });

    it('returns 404 when deleting non-existent session', async () => {
      const res = await request(app).delete('/sessions/ghost');
      expect(res.status).toBe(404);
    });
  });
});
