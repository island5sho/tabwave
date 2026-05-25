import { isDormantHighlighted, startDormantHighlightedSweeper } from '../dormant-highlighted-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'Test Session',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    highlighted: false,
    dormant: false,
    ...overrides,
  } as Session;
}

describe('isDormantHighlighted', () => {
  it('returns false when session is not highlighted', () => {
    const session = makeSession({ highlighted: false, lastAccessedAt: new Date(Date.now() - 10000).toISOString() });
    expect(isDormantHighlighted(session, 5000)).toBe(false);
  });

  it('returns false when session has no lastAccessedAt', () => {
    const session = makeSession({ highlighted: true, lastAccessedAt: undefined });
    expect(isDormantHighlighted(session, 5000)).toBe(false);
  });

  it('returns false when highlighted but not old enough', () => {
    const session = makeSession({
      highlighted: true,
      lastAccessedAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(isDormantHighlighted(session, 5000)).toBe(false);
  });

  it('returns true when highlighted and older than threshold', () => {
    const session = makeSession({
      highlighted: true,
      lastAccessedAt: new Date(Date.now() - 10000).toISOString(),
    });
    expect(isDormantHighlighted(session, 5000)).toBe(true);
  });
});

describe('startDormantHighlightedSweeper', () => {
  it('marks dormant-highlighted sessions as dormant', async () => {
    const oldDate = new Date(Date.now() - 20000).toISOString();
    const sessions = [
      makeSession({ id: 's1', highlighted: true, lastAccessedAt: oldDate }),
      makeSession({ id: 's2', highlighted: false, lastAccessedAt: oldDate }),
    ];
    const store = {
      getAll: jest.fn().mockResolvedValue(sessions),
      update: jest.fn().mockResolvedValue(undefined),
    } as any;

    const timer = startDormantHighlightedSweeper(store, 5000, 100);
    await new Promise((r) => setTimeout(r, 150));
    clearInterval(timer);

    expect(store.update).toHaveBeenCalledWith('s1', { dormant: true });
    expect(store.update).not.toHaveBeenCalledWith('s2', expect.anything());
  });

  it('does not mark sessions that are not old enough', async () => {
    const recentDate = new Date(Date.now() - 100).toISOString();
    const sessions = [
      makeSession({ id: 's3', highlighted: true, lastAccessedAt: recentDate }),
    ];
    const store = {
      getAll: jest.fn().mockResolvedValue(sessions),
      update: jest.fn().mockResolvedValue(undefined),
    } as any;

    const timer = startDormantHighlightedSweeper(store, 5000, 100);
    await new Promise((r) => setTimeout(r, 150));
    clearInterval(timer);

    expect(store.update).not.toHaveBeenCalled();
  });
});
