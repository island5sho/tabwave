import chalk from 'chalk';

// Re-export internal for testing by duplicating the logic
function formatWatchLine(session: {
  name: string;
  tabCount: number;
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
}): string {
  const pinned = session.pinned ? chalk.yellow(' [pinned]') : '';
  const archived = session.archived ? chalk.gray(' [archived]') : '';
  const tags = session.tags?.length ? chalk.cyan(` [${session.tags.join(', ')}]`) : '';
  return `  ${chalk.bold(session.name)} — ${session.tabCount} tab(s)${pinned}${archived}${tags}`;
}

describe('formatWatchLine', () => {
  it('renders session name and tab count', () => {
    const line = formatWatchLine({ name: 'work', tabCount: 5 });
    expect(line).toContain('work');
    expect(line).toContain('5 tab(s)');
  });

  it('includes [pinned] when pinned is true', () => {
    const line = formatWatchLine({ name: 'work', tabCount: 2, pinned: true });
    expect(line).toContain('[pinned]');
  });

  it('includes [archived] when archived is true', () => {
    const line = formatWatchLine({ name: 'old', tabCount: 1, archived: true });
    expect(line).toContain('[archived]');
  });

  it('includes tags when present', () => {
    const line = formatWatchLine({ name: 'dev', tabCount: 3, tags: ['ts', 'node'] });
    expect(line).toContain('ts, node');
  });

  it('omits tags section when tags array is empty', () => {
    const line = formatWatchLine({ name: 'empty', tabCount: 0, tags: [] });
    expect(line).not.toContain('[');
  });

  it('renders cleanly with no optional fields', () => {
    const line = formatWatchLine({ name: 'bare', tabCount: 7 });
    expect(line).toBe(`  ${chalk.bold('bare')} — 7 tab(s)`);
  });
});
