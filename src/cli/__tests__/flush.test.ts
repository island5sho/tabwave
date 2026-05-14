import axios from 'axios';
import { Command } from 'commander';
import { createFlushCommand } from '../commands/flush';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createFlushCommand());
  await program.parseAsync(['node', 'test', 'flush', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('flush command', () => {
  it('exits with message when --force is not provided', async () => {
    await runCommand([]);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(process.stdout.write).toBeDefined();
  });

  it('flushes all sessions when --force is provided', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { removed: 5 } });
    await runCommand(['--force']);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/flush',
      { params: {} }
    );
    expect(mockLog).toHaveBeenCalledWith('Flushed 5 session(s).');
  });

  it('flushes only archived sessions when --archived flag is set', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { removed: 2 } });
    await runCommand(['--force', '--archived']);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/flush',
      { params: { filter: 'archived' } }
    );
    expect(mockLog).toHaveBeenCalledWith('Flushed 2 session(s).');
  });

  it('flushes only frozen sessions when --frozen flag is set', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { removed: 3 } });
    await runCommand(['--force', '--frozen']);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/flush',
      { params: { filter: 'frozen' } }
    );
    expect(mockLog).toHaveBeenCalledWith('Flushed 3 session(s).');
  });

  it('prints error and exits on server failure', async () => {
    mockedAxios.delete.mockRejectedValueOnce({
      response: { data: { error: 'store locked' } },
    });
    await runCommand(['--force']);
    expect(mockError).toHaveBeenCalledWith('Flush failed: store locked');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('uses custom host when --host is provided', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { removed: 0 } });
    await runCommand(['--force', '--host', 'http://localhost:4000']);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/flush',
      { params: {} }
    );
  });
});
