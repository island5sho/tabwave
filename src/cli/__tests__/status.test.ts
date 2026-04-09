import axios from 'axios';
import { getStatus, StatusOptions } from '../commands/status';
import { SessionStore } from '../../storage/session-store';
import { Session } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeSession = (deviceId: string, urls: string[]): Session => ({
  id: `session-${deviceId}`,
  deviceId,
  tabs: urls.map((url, i) => ({ id: `t${i}`, url, title: url, pinned: false })),
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T10:00:00Z',
});

describe('getStatus', () => {
  let store: SessionStore;
  const options: StatusOptions = {
    serverUrl: 'http://localhost:3000',
    deviceId: 'device-1',
  };

  beforeEach(() => {
    store = new SessionStore();
    jest.clearAllMocks();
  });

  it('reports in sync when local and remote are identical', async () => {
    const session = makeSession('device-1', ['https://a.com']);
    store.save(session);
    mockedAxios.get = jest.fn().mockResolvedValue({ data: session });

    const result = await getStatus(store, options);

    expect(result.inSync).toBe(true);
    expect(result.addedTabs).toBe(0);
    expect(result.removedTabs).toBe(0);
  });

  it('reports added tabs when remote has more tabs', async () => {
    const local = makeSession('device-1', ['https://a.com']);
    const remote = makeSession('device-1', ['https://a.com', 'https://b.com']);
    store.save(local);
    mockedAxios.get = jest.fn().mockResolvedValue({ data: remote });

    const result = await getStatus(store, options);

    expect(result.inSync).toBe(false);
    expect(result.addedTabs).toBe(1);
  });

  it('returns inSync: true when neither local nor remote exist', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({ response: { status: 404 } });

    const result = await getStatus(store, options);

    expect(result.inSync).toBe(true);
    expect(result.localSummary).toBeNull();
    expect(result.remoteSummary).toBeNull();
  });

  it('reports out of sync when only local session exists', async () => {
    const local = makeSession('device-1', ['https://a.com']);
    store.save(local);
    mockedAxios.get = jest.fn().mockRejectedValue({ response: { status: 404 } });

    const result = await getStatus(store, options);

    expect(result.inSync).toBe(false);
    expect(result.localSummary).not.toBeNull();
    expect(result.remoteSummary).toBeNull();
  });

  it('throws on server connection error', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({ message: 'ECONNREFUSED' });

    await expect(getStatus(store, options)).rejects.toThrow(
      'Failed to reach server: ECONNREFUSED'
    );
  });
});
