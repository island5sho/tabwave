import axios from 'axios';
import { Command } from 'commander';
import { createProtectCommand } from '../commands/protect';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (args: string[]): Promise<void> => {
  const program = new Command();
  program.addCommand(createProtectCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'test', ...args]);
};

describe('protect command', () => {
  const mockSession = {
    id: 'abc123',
    name: 'Work',
    protected: true,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('protects a session', async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['protect', 'abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/protect',
      { protected: true }
    );
    expect(spy).toHaveBeenCalledWith('Session "Work" is now protected.');
    spy.mockRestore();
  });

  it('unprotects a session with --unprotect flag', async () => {
    const unprotectedSession = { ...mockSession, protected: false };
    mockedAxios.patch = jest.fn().mockResolvedValue({ data: unprotectedSession });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['protect', 'abc123', '--unprotect']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/protect',
      { protected: false }
    );
    expect(spy).toHaveBeenCalledWith('Session "Work" is now unprotected.');
    spy.mockRestore();
  });

  it('exits with error on 404', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({ response: { status: 404 } });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['protect', 'missing'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Session "missing" not found.');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error on generic failure', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({ message: 'Network Error' });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['protect', 'abc123'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Failed to protect session:', 'Network Error');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
