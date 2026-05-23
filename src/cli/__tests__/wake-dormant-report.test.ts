import axios from 'axios';
import { createWakeDormantReportCommand, printWakeDormantReportResult } from '../commands/wake-dormant-report';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let exitSpy: jest.SpyInstance;

beforeEach(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
});

afterEach(() => jest.restoreAllMocks());

async function runCommand(args: string[] = []) {
  const cmd = createWakeDormantReportCommand();
  await cmd.parseAsync(['node', 'test', ...args]);
}

describe('printWakeDormantReportResult', () => {
  it('prints nothing woken message when empty', () => {
    printWakeDormantReportResult({ woken: [], skipped: [], total: 0 });
    expect(logSpy).toHaveBeenCalledWith('No dormant sessions were woken.');
  });

  it('prints woken sessions', () => {
    printWakeDormantReportResult({ woken: ['abc', 'def'], skipped: [], total: 2 });
    expect(logSpy).toHaveBeenCalledWith('Woken 2 of 2 dormant session(s):');
    expect(logSpy).toHaveBeenCalledWith('  ✓ abc');
    expect(logSpy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped count when present', () => {
    printWakeDormantReportResult({ woken: ['abc'], skipped: ['xyz'], total: 2 });
    expect(logSpy).toHaveBeenCalledWith('Skipped 1 session(s) (protected or locked).');
  });
});

describe('createWakeDormantReportCommand', () => {
  it('posts to wake-dormant-report and prints result', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: { woken: ['s1'], skipped: [], total: 1 },
    });
    await runCommand();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-report'
    );
    expect(logSpy).toHaveBeenCalledWith('Woken 1 of 1 dormant session(s):');
  });

  it('handles dry-run by fetching report instead', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { sessions: [] },
    });
    await runCommand(['--dry-run']);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/dormant-report'
    );
    expect(logSpy).toHaveBeenCalledWith('[dry-run] Dormant report:');
  });

  it('exits on error', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('conn refused'));
    await runCommand();
    expect(errorSpy).toHaveBeenCalledWith('Error:', 'conn refused');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
