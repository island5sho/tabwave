import axios from 'axios';
import { printWakeDormantSinceAllResult, createWakeDormantSinceAllCommand } from '../commands/wake-dormant-since-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => jest.clearAllMocks());

describe('printWakeDormantSinceAllResult', () => {
  it('prints message when no sessions woken', () => {
    printWakeDormantSinceAllResult({ woken: [], skipped: [], since: '2024-01-01T00:00:00.000Z' });
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('No dormant sessions found'));
  });

  it('prints woken session ids', () => {
    printWakeDormantSinceAllResult({
      woken: ['abc', 'def'],
      skipped: [],
      since: '2024-01-01T00:00:00.000Z',
    });
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Woke 2'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('abc'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('def'));
  });

  it('reports skipped sessions', () => {
    printWakeDormantSinceAllResult({
      woken: ['abc'],
      skipped: ['xyz'],
      since: '2024-01-01T00:00:00.000Z',
    });
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Skipped 1'));
  });
});

describe('createWakeDormantSinceAllCommand', () => {
  async function runCommand(args: string[]): Promise<void> {
    const cmd = createWakeDormantSinceAllCommand();
    await cmd.parseAsync(['node', 'test', ...args]);
  }

  it('calls correct endpoint and prints result', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { woken: ['s1'], skipped: [], since: '2024-03-01T00:00:00.000Z' },
    });
    await runCommand(['--since', '2024-03-01']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-since-all',
      expect.objectContaining({ since: expect.any(String) })
    );
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('s1'));
  });

  it('exits with error on invalid date', async () => {
    await runCommand(['--since', 'not-a-date']);
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Invalid date'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits on server error', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'server down' } } });
    await runCommand(['--since', '2024-01-01']);
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('server down'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
