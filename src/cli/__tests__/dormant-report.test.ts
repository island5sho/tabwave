import { buildDormantReport, printDormantReport, DormantReportEntry } from '../commands/dormant-report';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-1',
    name: 'Test Session',
    tabs: [{ url: 'https://example.com', title: 'Example' }],
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    dormant: false,
    ...overrides,
  } as TabSession;
}

describe('buildDormantReport', () => {
  it('returns empty array when no dormant sessions', () => {
    const sessions = [makeSession({ dormant: false })];
    expect(buildDormantReport(sessions)).toEqual([]);
  });

  it('includes only dormant sessions', () => {
    const sessions = [
      makeSession({ id: 'a', name: 'Active', dormant: false }),
      makeSession({ id: 'b', name: 'Dormant', dormant: true, dormantAt: new Date('2024-01-01').toISOString() }),
    ];
    const report = buildDormantReport(sessions);
    expect(report).toHaveLength(1);
    expect(report[0].id).toBe('b');
    expect(report[0].name).toBe('Dormant');
  });

  it('computes daysDormant correctly', () => {
    const dormantAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const sessions = [makeSession({ dormant: true, dormantAt })];
    const report = buildDormantReport(sessions);
    expect(report[0].daysDormant).toBe(5);
  });

  it('sorts by daysDormant descending', () => {
    const sessions = [
      makeSession({ id: 'a', dormant: true, dormantAt: new Date(Date.now() - 2 * 86400000).toISOString() }),
      makeSession({ id: 'b', dormant: true, dormantAt: new Date(Date.now() - 10 * 86400000).toISOString() }),
      makeSession({ id: 'c', dormant: true, dormantAt: new Date(Date.now() - 1 * 86400000).toISOString() }),
    ];
    const report = buildDormantReport(sessions);
    expect(report[0].id).toBe('b');
    expect(report[2].id).toBe('c');
  });

  it('falls back to updatedAt if dormantAt is missing', () => {
    const updatedAt = new Date(Date.now() - 3 * 86400000).toISOString();
    const sessions = [makeSession({ dormant: true, updatedAt, dormantAt: undefined })];
    const report = buildDormantReport(sessions);
    expect(report[0].daysDormant).toBe(3);
  });
});

describe('printDormantReport', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints no dormant sessions message when empty', () => {
    printDormantReport([]);
    expect(consoleSpy).toHaveBeenCalledWith('No dormant sessions found.');
  });

  it('prints header and rows for entries', () => {
    const entries: DormantReportEntry[] = [
      {
        id: 'x',
        name: 'My Session',
        tabCount: 3,
        lastUpdated: new Date().toISOString(),
        dormantSince: new Date().toISOString(),
        daysDormant: 7,
      },
    ];
    printDormantReport(entries);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dormant Sessions Report'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('My Session'));
  });
});
