import { sweepDormantFrozen, startDormantFrozenSweeper } from '../dormant-frozen-sweeper';
import { SessionStore } from '../../storage/session-store';

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    name: 'Test Session',
    tabs: [],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    frozen: true,
    dormant: false,
    ...overrides,
  };
}

function buildStore(sessions: ReturnType<typeof makeSession>[]) {
  const updateMock = jest.fn().mockResolvedValue(undefined);
  return {
    store: {
      getAll: jest.fn().mockResolvedValue(sessions),
      update: updateMock,
    } as unknown as SessionStore,
    updateMock,
  };
}

describe('sweepDormantFrozen', () => {
  it('marks frozen sessions dormant when past threshold', async () => {
    const session = makeSession();
    const { store, updateMock } = buildStore([session]);

    const result = await sweepDormantFrozen(store, 7 * 24 * 60 * 60 * 1000);

    expect(result.swept).toContain('session-1');
    expect(result.total).toBe(1);
    expect(updateMock).toHaveBeenCalledWith('session-1', { dormant: true });
  });

  it('skips sessions that are not frozen', async () => {
    const session = makeSession({ frozen: false });
    const { store, updateMock } = buildStore([session]);

    const result = await sweepDormantFrozen(store);

    expect(result.swept).toHaveLength(0);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('skips sessions already marked dormant', async () => {
    const session = makeSession({ dormant: true });
    const { store, updateMock } = buildStore([session]);

    const result = await sweepDormantFrozen(store);

    expect(result.swept).toHaveLength(0);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('skips frozen sessions updated recently', async () => {
    const session = makeSession({
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const { store, updateMock } = buildStore([session]);

    const result = await sweepDormantFrozen(store, 7 * 24 * 60 * 60 * 1000);

    expect(result.swept).toHaveLength(0);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('falls back to createdAt when updatedAt is missing', async () => {
    const session = makeSession({ updatedAt: undefined });
    const { store, updateMock } = buildStore([session]);

    const result = await sweepDormantFrozen(store, 7 * 24 * 60 * 60 * 1000);

    expect(result.swept).toContain('session-1');
    expect(updateMock).toHaveBeenCalled();
  });

  it('handles empty session list', async () => {
    const { store, updateMock } = buildStore([]);

    const result = await sweepDormantFrozen(store);

    expect(result.swept).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('sweeps multiple eligible sessions', async () => {
    const s1 = makeSession({ id: 'a' });
    const s2 = makeSession({ id: 'b' });
    const s3 = makeSession({ id: 'c', frozen: false });
    const { store, updateMock } = buildStore([s1, s2, s3]);

    const result = await sweepDormantFrozen(store);

    expect(result.swept).toEqual(expect.arrayContaining(['a', 'b']));
    expect(result.total).toBe(2);
    expect(updateMock).toHaveBeenCalledTimes(2);
  });
});

describe('startDormantFrozenSweeper', () => {
  it('returns a timer handle', () => {
    const { store } = buildStore([]);
    const timer = startDormantFrozenSweeper(store, { intervalMs: 99999 });
    expect(timer).toBeDefined();
    clearInterval(timer);
  });
});
