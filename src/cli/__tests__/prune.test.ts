import axios from 'axios';
import { Command } from 'commander';
import { createPruneCommand, isStale } from '../commands/prune';
import { TabSession } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

function makeSession(id: string, daysOld: number, name = 'Session'): TabSession {
  const updatedAt = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  return { id, name, tabs: [], createdAt: updatedAt, updatedAt, tags: [], pinned: false, archived: false, locked: false };
}

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createPruneCommand());
  await program.parseAsync(['node', 'tabwave', 'prune', ...args]);
}

describe('isStale', () => {
  it('returns true when session is older than threshold', () => {
    const s = makeSession('s1', 40);
    expect(isStale(s, 30)).toBe(true);
  });

  it('returns false when session is within threshold', () => {
    const s = makeSession('s1', 10);
    expect(isStale(s, 30)).toBe(false);
  });

  it('returns false for a session updated exactly on threshold boundary', () => {
    const s = makeSession('s1', 0);
    expect(isStale(s, 30)).toBe(false);
  });
});

describe('prune command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prints message when no stale sessions found', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [makeSession('s1', 5)] });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['--days', '30']);
    expect(log).toHaveBeenCalledWith('No stale sessions found.');
    log.mockRestore();
  });

  it('lists sessions in dry-run mode without deleting', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [makeSession('s1', 40, 'Old Session')] });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['--days', '30', '--dry-run']);
    expect(mockedAxios.delete).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Would remove 1 session(s):');
    log.mockRestore();
  });

  it('deletes stale sessions', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [makeSession('s1', 40), makeSession('s2', 5)] });
    mockedAxios.delete.mockResolvedValueOnce({});
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['--days', '30']);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:3000/sessions/s1');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Pruned 1 session(s)'));
    log.mockRestore();
  });

  it('exits with error when server is unreachable', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runCommand([])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    err.mockRestore();
  });
});
