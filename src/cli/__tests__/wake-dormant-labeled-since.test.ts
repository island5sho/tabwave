import axios from 'axios';
import { Command } from 'commander';
import {
  createWakeDormantLabeledSinceCommand,
  printWakeDormantLabeledSinceResult,
} from '../commands/wake-dormant-labeled-since';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

afterEach(() => jest.clearAllMocks());

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createWakeDormantLabeledSinceCommand());
  await program.parseAsync(['node', 'test', 'wake-dormant-labeled-since', ...args]);
}

describe('printWakeDormantLabeledSinceResult', () => {
  it('prints message when no sessions woken', () => {
    printWakeDormantLabeledSinceResult({ woken: [] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No dormant'));
  });

  it('prints woken session ids', () => {
    printWakeDormantLabeledSinceResult({ woken: ['a', 'b'] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('a'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('b'));
  });
});

describe('createWakeDormantLabeledSinceCommand', () => {
  it('calls server and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['sess-1'] } });
    await runCommand(['--since', '2024-01-01']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-labeled-since',
      { since: '2024-01-01' }
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('1'));
  });

  it('passes label filter when provided', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: [] } });
    await runCommand(['--since', '2024-01-01', '--label', 'work']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { since: '2024-01-01', label: 'work' }
    );
  });

  it('handles server error gracefully', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { error: 'server fail' } }, message: 'err' });
    await runCommand(['--since', '2024-01-01']);
    expect(errorSpy).toHaveBeenCalledWith('Error:', 'server fail');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
