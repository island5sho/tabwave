import axios from 'axios';
import { Command } from 'commander';
import {
  createWakeDormantTaggedSinceCommand,
  printWakeDormantTaggedSinceResult,
  WakeDormantTaggedSinceResult,
} from '../commands/wake-dormant-tagged-since';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantTaggedSinceResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints a message when no sessions are woken', () => {
    printWakeDormantTaggedSinceResult({ woken: [], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      'No dormant tagged sessions found before the given date.'
    );
  });

  it('prints woken session ids', () => {
    printWakeDormantTaggedSinceResult({ woken: ['abc', 'def'], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ abc');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped count when non-zero', () => {
    printWakeDormantTaggedSinceResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(consoleSpy).toHaveBeenCalledWith('Skipped 1 session(s).');
  });
});

describe('createWakeDormantTaggedSinceCommand', () => {
  let errorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls the correct endpoint and prints result', async () => {
    const result: WakeDormantTaggedSinceResult = { woken: ['s1'], skipped: [] };
    mockedAxios.post.mockResolvedValueOnce({ data: result });

    const cmd = createWakeDormantTaggedSinceCommand();
    await cmd.parseAsync(['work', '2024-01-01T00:00:00Z', '--port', '3000'], { from: 'user' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-tagged-since',
      { tag: 'work', since: '2024-01-01T00:00:00Z' }
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 session(s):');
  });

  it('exits with code 1 on error', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'Network error', response: undefined });

    const cmd = createWakeDormantTaggedSinceCommand();
    await cmd.parseAsync(['work', '2024-01-01T00:00:00Z'], { from: 'user' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error:', 'Network error');
  });
});
