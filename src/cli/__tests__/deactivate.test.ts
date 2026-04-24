import axios from 'axios';
import { Command } from 'commander';
import { createDeactivateCommand } from '../commands/deactivate';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
  throw new Error(`process.exit: ${code}`);
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createDeactivateCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'test', 'deactivate', ...args]);
}

describe('deactivate command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deactivates a session successfully', async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', active: false },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/deactivate'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Session "Work Tabs" has been deactivated.');
    consoleSpy.mockRestore();
  });

  it('handles 404 not found', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({
      response: { status: 404 },
      message: 'Not Found',
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['missing-id'])).rejects.toThrow('process.exit: 1');
    expect(consoleSpy).toHaveBeenCalledWith('Session not found: missing-id');
    consoleSpy.mockRestore();
  });

  it('handles 409 already inactive', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({
      response: { status: 409 },
      message: 'Conflict',
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['abc123'])).rejects.toThrow('process.exit: 1');
    expect(consoleSpy).toHaveBeenCalledWith('Session is already inactive: abc123');
    consoleSpy.mockRestore();
  });

  it('uses custom host and port', async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({
      status: 200,
      data: { id: 'xyz', name: 'Dev', active: false },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['xyz', '--host', '192.168.1.5', '--port', '4000']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://192.168.1.5:4000/sessions/xyz/deactivate'
    );
    consoleSpy.mockRestore();
  });
});
