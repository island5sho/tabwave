import axios from 'axios';
import { printWakeDormantBatchResult, createWakeDormantBatchCommand, WakeDormantBatchResult } from '../commands/wake-dormant-batch';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

describe('printWakeDormantBatchResult', () => {
  let log: jest.SpyInstance;

  beforeEach(() => { log = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { log.mockRestore(); });

  it('prints woken, skipped, and failed sessions', () => {
    printWakeDormantBatchResult({ woken: ['a'], skipped: ['b'], failed: ['c'] });
    expect(log).toHaveBeenCalledWith('Woken (1):');
    expect(log).toHaveBeenCalledWith('  ✓ a');
    expect(log).toHaveBeenCalledWith('Skipped (1):');
    expect(log).toHaveBeenCalledWith('  - b');
    expect(log).toHaveBeenCalledWith('Failed (1):');
    expect(log).toHaveBeenCalledWith('  ✗ c');
  });

  it('prints empty message when all arrays are empty', () => {
    printWakeDormantBatchResult({ woken: [], skipped: [], failed: [] });
    expect(log).toHaveBeenCalledWith('No dormant sessions matched the provided IDs.');
  });
});

describe('createWakeDormantBatchCommand', () => {
  let log: jest.SpyInstance;
  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { log.mockRestore(); errorLog.mockRestore(); });

  it('calls the batch endpoint and prints results', async () => {
    const result: WakeDormantBatchResult = { woken: ['s1', 's2'], skipped: [], failed: [] };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    const cmd = createWakeDormantBatchCommand();
    await cmd.parseAsync(['node', 'test', 's1', 's2']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-batch',
      { ids: ['s1', 's2'] }
    );
    expect(log).toHaveBeenCalledWith('Woken (2):');
  });

  it('uses custom host and port', async () => {
    const result: WakeDormantBatchResult = { woken: [], skipped: ['s1'], failed: [] };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    const cmd = createWakeDormantBatchCommand();
    await cmd.parseAsync(['node', 'test', 's1', '--host', '0.0.0.0', '--port', '4000']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://0.0.0.0:4000/sessions/wake-dormant-batch',
      { ids: ['s1'] }
    );
  });

  it('exits on request failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'Network error', response: undefined });
    const cmd = createWakeDormantBatchCommand();
    await expect(cmd.parseAsync(['node', 'test', 's1'])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
