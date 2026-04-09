import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  readSessions,
  writeSessions,
  upsertSession,
  deleteSession,
  getSession,
} from '../session-store';
import { TabSession } from '../../types/session';

const makeSession = (id: string): TabSession => ({
  id,
  name: `Session ${id}`,
  deviceId: 'device-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tabs: [
    { id: 'tab-1', url: 'https://example.com', title: 'Example', pinned: false },
  ],
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tabwave-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('session-store', () => {
  test('readSessions returns empty store when file does not exist', async () => {
    const store = await readSessions(tmpDir);
    expect(store.sessions).toEqual({});
    expect(store.lastUpdated).toBeDefined();
  });

  test('writeSessions and readSessions round-trip', async () => {
    const session = makeSession('abc123');
    await writeSessions({ sessions: { abc123: session }, lastUpdated: '' }, tmpDir);
    const store = await readSessions(tmpDir);
    expect(store.sessions['abc123']).toMatchObject({ id: 'abc123', name: 'Session abc123' });
  });

  test('upsertSession adds a new session', async () => {
    const session = makeSession('s1');
    await upsertSession(session, tmpDir);
    const result = await getSession('s1', tmpDir);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('s1');
  });

  test('upsertSession updates an existing session', async () => {
    const session = makeSession('s2');
    await upsertSession(session, tmpDir);
    const updated = { ...session, name: 'Updated Session' };
    await upsertSession(updated, tmpDir);
    const result = await getSession('s2', tmpDir);
    expect(result?.name).toBe('Updated Session');
  });

  test('deleteSession removes a session and returns true', async () => {
    await upsertSession(makeSession('s3'), tmpDir);
    const removed = await deleteSession('s3', tmpDir);
    expect(removed).toBe(true);
    expect(await getSession('s3', tmpDir)).toBeNull();
  });

  test('deleteSession returns false for non-existent session', async () => {
    const removed = await deleteSession('ghost', tmpDir);
    expect(removed).toBe(false);
  });
});
