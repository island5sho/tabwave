import axios from 'axios';
import { pullSession, PullOptions } from '../commands/pull';
import { SessionStore } from '../../storage/session-store';
import { Session } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeSession = (deviceId: string, updatedAt: string): Session => ({
  id: `session-${deviceId}`,
  deviceId,
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example', pinned: false }
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt,
});

describe('pullSession', () => {
  let store: SessionStore;
  const options: PullOptions = {
    serverUrl: 'http://localhost:3000',
    deviceId: 'device-1',
  };

  beforeEach(() => {
    store = new SessionStore();
    jest.clearAllMocks();
  });

  it('saves remote session when no local session exists', async () => {
    const remote = makeSession('device-1', '2024-06-01T10:00:00Z');
    mockedAxios.get = jest.fn().mockResolvedValue({ data: remote });

    const result = await pullSession(store, options);

    expect(result.updated).toBe(true);
    expect(store.get('device-1')).toEqual(remote);
  });

  it('returns updated: false when sessions are identical', async () => {
    const session = makeSession('device-1', '2024-06-01T10:00:00Z');
    store.save(session);
    mockedAxios.get = jest.fn().mockResolvedValue({ data: session });

    const result = await pullSession(store, options);

    expect(result.updated).toBe(false);
  });

  it('uses remote session when force is true', async () => {
    const local = makeSession('device-1', '2024-06-01T08:00:00Z');
    const remote = makeSession('device-1', '2024-06-01T10:00:00Z');
    remote.tabs.push({ id: 't2', url: 'https://remote.com', title: 'Remote', pinned: false });
    store.save(local);
    mockedAxios.get = jest.fn().mockResolvedValue({ data: remote });

    const result = await pullSession(store, { ...options, force: true });

    expect(result.updated).toBe(true);
    expect(result.session).toEqual(remote);
  });

  it('throws an error when server returns 404', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({ response: { status: 404 } });

    await expect(pullSession(store, options)).rejects.toThrow(
      'No remote session found for device: device-1'
    );
  });

  it('throws an error on network failure', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({ message: 'Network Error' });

    await expect(pullSession(store, options)).rejects.toThrow(
      'Failed to fetch remote session: Network Error'
    );
  });
});
