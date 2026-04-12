import { sortSessions } from '../commands/sort';
import { TabSession } from '../../types/session';

const makeSession = (overrides: Partial<TabSession>): TabSession => ({
  id: 'sess-1',
  name: 'Session',
  tabs: [],
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  tags: [],
  pinned: false,
  archived: false,
  ...overrides,
});

const sessions: TabSession[] = [
  makeSession({ id: 'a', name: 'Zebra', tabs: [{} as any, {} as any, {} as any], updatedAt: new Date('2024-03-01').toISOString() }),
  makeSession({ id: 'b', name: 'Apple', tabs: [{} as any], updatedAt: new Date('2024-01-01').toISOString() }),
  makeSession({ id: 'c', name: 'Mango', tabs: [{} as any, {} as any], updatedAt: new Date('2024-02-01').toISOString() }),
];

describe('sortSessions', () => {
  it('sorts by name ascending', () => {
    const result = sortSessions(sessions, 'name', 'asc');
    expect(result.map((s) => s.name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('sorts by name descending', () => {
    const result = sortSessions(sessions, 'name', 'desc');
    expect(result.map((s) => s.name)).toEqual(['Zebra', 'Mango', 'Apple']);
  });

  it('sorts by tabCount ascending', () => {
    const result = sortSessions(sessions, 'tabCount', 'asc');
    expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by tabCount descending', () => {
    const result = sortSessions(sessions, 'tabCount', 'desc');
    expect(result.map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by updatedAt descending', () => {
    const result = sortSessions(sessions, 'updatedAt', 'desc');
    expect(result.map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by updatedAt ascending', () => {
    const result = sortSessions(sessions, 'updatedAt', 'asc');
    expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the original array', () => {
    const original = [...sessions];
    sortSessions(sessions, 'name', 'asc');
    expect(sessions).toEqual(original);
  });

  it('returns empty array when given empty input', () => {
    const result = sortSessions([], 'name', 'asc');
    expect(result).toEqual([]);
  });
});
