import axios from 'axios';
import { printWakeDormantTaggedResult, createWakeDormantTaggedCommand, WakeDormantTaggedResult } from '../commands/wake-dormant-tagged';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantTaggedResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints woken and skipped sessions', () => {
    const result: WakeDormantTaggedResult = {
      tag: 'work',
      woken: ['sess-1', 'sess-2'],
      skipped: ['sess-3'],
    };
    printWakeDormantTaggedResult(result);
    expect(consoleSpy).toHaveBeenCalledWith('Tag: work');
    expect(consoleSpy).toHaveBeenCalledWith('Woken (2):');
    expect(consoleSpy).toHaveBeenCalledWith('  + sess-1');
    expect(consoleSpy).toHaveBeenCalledWith('Skipped (1):');
    expect(consoleSpy).toHaveBeenCalledWith('  - sess-3');
  });

  it('prints message when no sessions woken', () => {
    const result: WakeDormantTaggedResult = { tag: 'personal', woken: [], skipped: [] };
    printWakeDormantTaggedResult(result);
    expect(consoleSpy).toHaveBeenCalledWith('No dormant sessions with this tag were woken.');
  });
});

describe('createWakeDormantTaggedCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct endpoint and prints result', async () => {
    const result: WakeDormantTaggedResult = { tag: 'work', woken: ['sess-1'], skipped: [] };
    mockedAxios.post.mockResolvedValueOnce({ data: result });

    const cmd = createWakeDormantTaggedCommand();
    await cmd.parseAsync(['node', 'test', 'work']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-tagged',
      { tag: 'work' }
    );
    expect(logSpy).toHaveBeenCalledWith('Tag: work');
  });

  it('exits with error on failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'network error' });

    const cmd = createWakeDormantTaggedCommand();
    await expect(cmd.parseAsync(['node', 'test', 'work'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Error: network error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
