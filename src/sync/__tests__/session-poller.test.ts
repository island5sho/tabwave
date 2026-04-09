import { SessionPoller } from '../session-poller';
import { SessionStore } from '../../storage/session-store';
import { SessionSyncer } from '../session-syncer';
import { Session } from '../../types/session';

const makeSession = (id: string, updatedAt: number): Session => ({
  id,
  name: `Session ${id}`,
  tabs: [],
  createdAt: 1000,
  updatedAt,
  deviceId: 'device-1',
});

describe('SessionPoller', () => {
  let store: jest.Mocked<SessionStore>;
  let syncer: jest.Mocked<SessionSyncer>;

  beforeEach(() => {
    store = {
      getAll: jest.fn(),
      save: jest.fn(),
      getById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<SessionStore>;

    syncer = {
      fetchRemote: jest.fn(),
      sync: jest.fn(),
    } as unknown as jest.Mocked<SessionSyncer>;
  });

  it('starts and stops without error', () => {
    const poller = new SessionPoller(store, syncer, { intervalMs: 10000 });
    expect(poller.isRunning()).toBe(false);
    poller.start();
    expect(poller.isRunning()).toBe(true);
    poller.stop();
    expect(poller.isRunning()).toBe(false);
  });

  it('does not start twice', () => {
    const poller = new SessionPoller(store, syncer, { intervalMs: 10000 });
    poller.start();
    poller.start();
    expect(poller.isRunning()).toBe(true);
    poller.stop();
  });

  it('syncs session when remote differs', async () => {
    const local = makeSession('s1', 100);
    const remote = makeSession('s1', 200);
    const synced = makeSession('s1', 200);

    store.getAll.mockReturnValue([local]);
    syncer.fetchRemote.mockResolvedValue(remote);
    syncer.sync.mockResolvedValue(synced);

    const onSync = jest.fn();
    const poller = new SessionPoller(store, syncer, { onSync });
    await (poller as any).poll();

    expect(syncer.sync).toHaveBeenCalledWith('s1');
    expect(store.save).toHaveBeenCalledWith(synced);
    expect(onSync).toHaveBeenCalledWith(synced);
  });

  it('skips sync when no remote found', async () => {
    store.getAll.mockReturnValue([makeSession('s1', 100)]);
    syncer.fetchRemote.mockResolvedValue(null);

    await (poller as any).poll();
    expect(syncer.sync).not.toHaveBeenCalled();
  });

  it('calls onError when poll throws', async () => {
    store.getAll.mockImplementation(() => { throw new Error('store failure'); });
    const onError = jest.fn();
    const poller = new SessionPoller(store, syncer, { onError });
    await (poller as any).poll();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
