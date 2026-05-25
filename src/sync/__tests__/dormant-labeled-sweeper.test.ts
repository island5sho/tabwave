import { isDormantLabeled, startDormantLabeledSweeper } from '../dormant-labeled-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'sess-1',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dormant: false,
    ...overrides,
  } as Session;
}

describe('isDormantLabeled', () => {
  it('returns false when session has no label', () => {
    const session = makeSession({ updatedAt: new Date(Date.now() - 8 * 86400000).toISOString() });
    expect(isDormantLabeled(session)).toBe(false);
  });

  it('returns false when session is already dormant', () => {
    const session = makeSession({
      label: 'work',
      dormant: true,
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    });
    expect(isDormantLabeled(session)).toBe(false);
  });

  it('returns false when session was updated recently', () => {
    const session = makeSession({ label: 'work', updatedAt: new Date().toISOString() });
    expect(isDormantLabeled(session)).toBe(false);
  });

  it('returns true when labeled session exceeds threshold', () => {
    const session = makeSession({
      label: 'research',
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    });
    expect(isDormantLabeled(session)).toBe(true);
  });

  it('respects custom threshold', () => {
    const session = makeSession({
      label: 'research',
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });
    expect(isDormantLabeled(session, 1 * 86400000)).toBe(true);
  });
});

describe('startDormantLabeledSweeper', () => {
  it('marks labeled dormant sessions and clears interval', async () => {
    const staleSession = makeSession({
      id: 'stale',
      label: 'old',
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    });
    const freshSession = makeSession({ id: 'fresh', label: 'new' });
    const store = {
      getAll: jest.fn().mockResolvedValue([staleSession, freshSession]),
      update: jest.fn().mockResolvedValue(undefined),
    } as any;

    jest.useFakeTimers();
    const timer = startDormantLabeledSweeper(store, 1000);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    clearInterval(timer);
    jest.useRealTimers();

    expect(store.update).toHaveBeenCalledWith('stale', { dormant: true });
    expect(store.update).not.toHaveBeenCalledWith('fresh', expect.anything());
  });
});
