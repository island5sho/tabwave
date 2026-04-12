import request from 'supertest';
import { createApp } from '../app';
import { SessionStore } from '../../storage/session-store';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-default',
    name: 'Default',
    tabs: [{ url: 'https://example.com', title: 'Example' }],
    tags: [],
    device: 'test-device',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    locked: false,
    archived: false,
    ...overrides,
  };
}

describe('Group route integration', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
    store.save(makeSession({ id: 'a', tags: ['alpha'], device: 'mac' }));
    store.save(makeSession({ id: 'b', tags: ['beta'], device: 'linux' }));
    store.save(makeSession({ id: 'c', tags: ['alpha', 'beta'], device: 'mac' }));
  });

  it('groups by tag via full app', async () => {
    const app = createApp(store);
    const res = await request(app).get('/sessions/group/tag');
    expect(res.status).toBe(200);
    expect(res.body['alpha']).toHaveLength(2);
    expect(res.body['beta']).toHaveLength(2);
  });

  it('groups by device via full app', async () => {
    const app = createApp(store);
    const res = await request(app).get('/sessions/group/device');
    expect(res.status).toBe(200);
    expect(res.body['mac']).toHaveLength(2);
    expect(res.body['linux']).toHaveLength(1);
  });
});
