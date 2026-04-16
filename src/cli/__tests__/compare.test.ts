import { printComparison } from '../commands/compare';
import { TabSession } from '../../types/session';

function makeSession(name: string, tabs: { url: string; title: string }[]): TabSession {
  return {
    id: name,
    name,
    tabs: tabs.map((t, i) => ({ id: `${name}-${i}`, ...t, pinned: false, active: false })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  };
}

describe('printComparison', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('reports identical sessions', () => {
    const a = makeSession('A', [{ url: 'https://example.com', title: 'Example' }]);
    const b = makeSession('B', [{ url: 'https://example.com', title: 'Example' }]);
    printComparison(a, b);
    expect(log).toHaveBeenCalledWith('Sessions are identical.');
  });

  it('shows added tabs', () => {
    const a = makeSession('A', []);
    const b = makeSession('B', [{ url: 'https://new.com', title: 'New' }]);
    printComparison(a, b);
    const calls = log.mock.calls.flat().join('\n');
    expect(calls).toContain('+');
    expect(calls).toContain('https://new.com');
  });

  it('shows removed tabs', () => {
    const a = makeSession('A', [{ url: 'https://old.com', title: 'Old' }]);
    const b = makeSession('B', []);
    printComparison(a, b);
    const calls = log.mock.calls.flat().join('\n');
    expect(calls).toContain('-');
    expect(calls).toContain('https://old.com');
  });

  it('prints summary line', () => {
    const a = makeSession('A', [{ url: 'https://a.com', title: 'A' }]);
    const b = makeSession('B', [{ url: 'https://b.com', title: 'B' }]);
    printComparison(a, b);
    const calls = log.mock.calls.flat().join('\n');
    expect(calls).toContain('Summary:');
  });
});
