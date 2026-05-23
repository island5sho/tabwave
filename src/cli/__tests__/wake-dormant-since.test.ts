import axios from 'axios';
import { printWakeDormantSinceResult, createWakeDormantSinceCommand } from '../commands/wake-dormant-since';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantSinceResult', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('prints no-match message when woken list is empty', () => {
    printWakeDormantSinceResult([], []);
    expect(logSpy).toHaveBeenCalledWith('No dormant sessions matched the given time range.');
  });

  it('prints woken session ids', () => {
    printWakeDormantSinceResult(['abc', 'def'], []);
    expect(logSpy).toHaveBeenCalledWith('Woke 2 dormant session(s) dormant since cutoff:');
    expect(logSpy).toHaveBeenCalledWith('  ✓ abc');
    expect(logSpy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped count when present', () => {
    printWakeDormantSinceResult(['abc'], ['xyz']);
    expect(logSpy).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or outside range).');
  });
});

describe('createWakeDormantSinceCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  async function run(args: string[]) {
    const cmd = createWakeDormantSinceCommand();
    await cmd.parseAsync(['node', 'wake-dormant-since', ...args]);
  }

  it('calls the correct endpoint and prints results', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: ['s1'], skipped: ['s2'] } });
    await run(['--since', '2024-01-01']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-since',
      { since: '2024-01-01' }
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 dormant session(s) dormant since cutoff:');
  });

  it('exits with code 1 on server error', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { error: 'bad request' } } });
    await run(['--since', '2024-01-01']);
    expect(errorSpy).toHaveBeenCalledWith('Error: bad request');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('uses custom host and port', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: [], skipped: [] } });
    await run(['--since', '2024-06-01', '--host', '0.0.0.0', '--port', '4000']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://0.0.0.0:4000/sessions/wake-dormant-since',
      { since: '2024-06-01' }
    );
  });
});
