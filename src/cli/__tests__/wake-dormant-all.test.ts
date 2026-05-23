import axios from 'axios';
import { Command } from 'commander';
import {
  createWakeDormantAllCommand,
  printWakeDormantAllResult,
  WakeDormantAllResult,
} from '../commands/wake-dormant-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const BASE_URL = 'http://localhost:3000';

async function runCommand(cmd: Command, args: string[]): Promise<void> {
  await cmd.parseAsync(['node', 'test', ...args]);
}

describe('wake-dormant-all command', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints message when no dormant sessions', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: [], skipped: [] } });
    const cmd = createWakeDormantAllCommand(BASE_URL);
    await runCommand(cmd, []);
    expect(logSpy).toHaveBeenCalledWith('No dormant sessions to wake.');
  });

  it('prints woken sessions', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { woken: ['alpha', 'beta'], skipped: [] },
    });
    const cmd = createWakeDormantAllCommand(BASE_URL);
    await runCommand(cmd, []);
    expect(logSpy).toHaveBeenCalledWith('Woke 2 dormant session(s):');
    expect(logSpy).toHaveBeenCalledWith('  ✓ alpha');
    expect(logSpy).toHaveBeenCalledWith('  ✓ beta');
  });

  it('reports skipped sessions', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { woken: ['gamma'], skipped: ['locked-one'] },
    });
    const cmd = createWakeDormantAllCommand(BASE_URL);
    await runCommand(cmd, []);
    expect(logSpy).toHaveBeenCalledWith('Skipped 1 session(s) (protected or frozen).');
  });

  it('passes force flag in request body', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: [], skipped: [] } });
    const cmd = createWakeDormantAllCommand(BASE_URL);
    await runCommand(cmd, ['--force']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/sessions/wake-dormant-all`,
      { force: true }
    );
  });

  it('handles server error gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'internal error' } },
      message: 'Request failed',
    });
    const cmd = createWakeDormantAllCommand(BASE_URL);
    await runCommand(cmd, []);
    expect(errorSpy).toHaveBeenCalledWith('Error waking dormant sessions:', 'internal error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('printWakeDormantAllResult', () => {
  let logSpy: jest.SpyInstance;
  beforeEach(() => { logSpy = jest.spyOn(console, 'log').mockImplementation(); });
  afterEach(() => jest.restoreAllMocks());

  it('handles empty result', () => {
    printWakeDormantAllResult({ woken: [], skipped: [] });
    expect(logSpy).toHaveBeenCalledWith('No dormant sessions to wake.');
  });

  it('lists each woken session', () => {
    printWakeDormantAllResult({ woken: ['s1', 's2'], skipped: [] });
    expect(logSpy).toHaveBeenCalledWith('  ✓ s1');
    expect(logSpy).toHaveBeenCalledWith('  ✓ s2');
  });
});
