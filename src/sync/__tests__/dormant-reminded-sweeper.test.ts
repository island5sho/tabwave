import { isDormantReminded, startDormantRemindedSweeper } from '../dormant-reminded-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dormant: false,
    ...overrides
  } as Session;
}

describe('isDormantReminded', () => {
  it('returns true for dormant session with reminder', () => {
    const s = makeSession({ dormant: true, reminder: '2025-01-01T00:00:00.000Z' } as any);
    expect(isDormantReminded(s)).toBe(true);
  });

  it('returns false when not dormant', () => {
    const s = makeSession({ dormant: false, reminder: '2025-01-01T00:00:00.000Z' } as any);
    expect(isDormantReminded(s)).toBe(false);
  });

  it('returns false when dormant but no reminder', () => {
    const s = makeSession({ dormant: true, reminder: undefined } as any);
    expect(isDormantReminded(s)).toBe(false);
  });
});

describe('startDormantRemindedSweeper', () => {
  it('wakes dormant reminded sessions on tick', async () => {
    const session = makeSession({ dormant: true, reminder: '2025-01-01T00:00:00.000Z' } as any);
    const store = {
      list: jest.fn().mockResolvedValue([session]),
      save: jest.fn().mockResolvedValue(undefined)
    } as any;

    jest.useFakeTimers();
    const timer = startDormantRemindedSweeper(store, 1000);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await Promise.resolve();
    clearInterval(timer);
    jest.useRealTimers();

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-id', dormant: false })
    );
  });

  it('does not wake non-dormant sessions', async () => {
    const session = makeSession({ dormant: false, reminder: 'some-reminder' } as any);
    const store = {
      list: jest.fn().mockResolvedValue([session]),
      save: jest.fn()
    } as any;

    jest.useFakeTimers();
    const timer = startDormantRemindedSweeper(store, 1000);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    clearInterval(timer);
    jest.useRealTimers();

    expect(store.save).not.toHaveBeenCalled();
  });
});
