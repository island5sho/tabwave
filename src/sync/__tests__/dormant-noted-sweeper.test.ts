import { isDormantNoted, startDormantNotedSweeper } from '../dormant-noted-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'Test',
    tabs: [],
    dormant: false,
    note: 'A note',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  } as Session;
}

describe('isDormantNoted', () => {
  const threshold = 7 * 24 * 60 * 60 * 1000;

  it('returns true when session has note and is older than threshold', () => {
    const session = makeSession();
    expect(isDormantNoted(session, threshold)).toBe(true);
  });

  it('returns false when session has no note', () => {
    const session = makeSession({ note: undefined });
    expect(isDormantNoted(session, threshold)).toBe(false);
  });

  it('returns false when session is already dormant', () => {
    const session = makeSession({ dormant: true });
    expect(isDormantNoted(session, threshold)).toBe(false);
  });

  it('returns false when session is newer than threshold', () => {
    const session = makeSession({
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isDormantNoted(session, threshold)).toBe(false);
  });
});

describe('startDormantNotedSweeper', () => {
  it('marks stale noted sessions as dormant', async () => {
    const session = makeSession();
    const store = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue({ ...session, dormant: true }),
    } as any;

    jest.useFakeTimers();
    const timer = startDormantNotedSweeper(store, 1000, 7 * 24 * 60 * 60 * 1000);
    jest.advanceTimersByTime(1001);
    await Promise.resolve();
    clearInterval(timer);
    jest.useRealTimers();

    expect(store.update).toHaveBeenCalledWith('session-1', { dormant: true });
  });

  it('skips sessions that are not stale', async () => {
    const session = makeSession({
      updatedAt: new Date().toISOString(),
    });
    const store = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn(),
    } as any;

    jest.useFakeTimers();
    const timer = startDormantNotedSweeper(store, 1000, 7 * 24 * 60 * 60 * 1000);
    jest.advanceTimersByTime(1001);
    await Promise.resolve();
    clearInterval(timer);
    jest.useRealTimers();

    expect(store.update).not.toHaveBeenCalled();
  });
});
