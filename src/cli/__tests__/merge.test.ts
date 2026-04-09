import axios from 'axios';
import { Command } from 'commander';
import { createMergeCommand } from '../commands/merge';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLocal = {
  id: 'local-1',
  name: 'work',
  tabs: [{ id: 't1', url: 'https://example.com', title: 'Example', active: false }],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const mockRemote = {
  id: 'remote-1',
  name: 'work-remote',
  tabs: [
    { id: 't2', url: 'https://github.com', title: 'GitHub', active: true },
    { id: 't3', url: 'https://docs.example.com', title: 'Docs', active: false },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-03T00:00:00.000Z',
};

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createMergeCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', ...args]);
}

describe('merge command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('merges two sessions using newest strategy by default', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockLocal })
      .mockResolvedValueOnce({ data: mockRemote });
    mockedAxios.put.mockResolvedValueOnce({ data: {} });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['merge', 'work', 'work-remote']);

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/sessions/work'));
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/sessions/work-remote'));
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/work'),
      expect.objectContaining({ name: 'work' })
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Merged'));
    consoleSpy.mockRestore();
  });

  it('exits with error if local session not found', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Not found'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['merge', 'nonexistent', 'work-remote'])).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Local session'));
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits with error if remote session not found', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockLocal })
      .mockRejectedValueOnce(new Error('Not found'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['merge', 'work', 'nonexistent'])).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Remote session'));
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits with error on invalid strategy', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockLocal })
      .mockResolvedValueOnce({ data: mockRemote });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['merge', 'work', 'work-remote', '--strategy', 'invalid'])).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid strategy'));
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
