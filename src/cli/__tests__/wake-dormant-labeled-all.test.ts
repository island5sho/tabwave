import axios from 'axios';
import {
  printWakeDormantLabeledAllResult,
  createWakeDormantLabeledAllCommand,
  WakeDormantLabeledAllResult,
} from '../commands/wake-dormant-labeled-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(...args: string[]) {
  const cmd = createWakeDormantLabeledAllCommand();
  await cmd.parseAsync(['node', 'test', ...args]);
}

afterEach(() => jest.clearAllMocks());

describe('printWakeDormantLabeledAllResult', () => {
  it('prints message when nothing was woken', () => {
    printWakeDormantLabeledAllResult({ woken: [], skipped: [] });
    expect(mockLog).toHaveBeenCalledWith(
      'No dormant sessions with that label were found.'
    );
  });

  it('prints woken session ids', () => {
    const result: WakeDormantLabeledAllResult = {
      woken: ['s1', 's2'],
      skipped: [],
    };
    printWakeDormantLabeledAllResult(result);
    expect(mockLog).toHaveBeenCalledWith('Woke 2 session(s) with label:');
    expect(mockLog).toHaveBeenCalledWith('  + s1');
    expect(mockLog).toHaveBeenCalledWith('  + s2');
  });

  it('prints skipped count when some sessions were skipped', () => {
    const result: WakeDormantLabeledAllResult = {
      woken: ['s1'],
      skipped: ['s2', 's3'],
    };
    printWakeDormantLabeledAllResult(result);
    expect(mockLog).toHaveBeenCalledWith(
      'Skipped 2 session(s) (not dormant or missing label).'
    );
  });
});

describe('createWakeDormantLabeledAllCommand', () => {
  it('posts to the correct endpoint and prints result', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { woken: ['abc'], skipped: [] },
    });
    await runCommand('--label', 'work');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-labeled-all',
      { label: 'work' }
    );
    expect(mockLog).toHaveBeenCalledWith('Woke 1 session(s) with label:');
  });

  it('respects custom host option', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { woken: [], skipped: [] },
    });
    await runCommand('--label', 'personal', '--host', 'http://localhost:4000');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/wake-dormant-labeled-all',
      { label: 'personal' }
    );
  });

  it('exits with code 1 on server error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'label not found' } },
      message: 'Request failed',
    });
    await runCommand('--label', 'missing');
    expect(mockError).toHaveBeenCalledWith('Error:', 'label not found');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
