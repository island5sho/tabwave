import axios from 'axios';
import { Command } from 'commander';
import { createDuplicateCommand } from '../commands/duplicate';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = {
  id: 'abc123',
  name: 'Work Tabs',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tabs: [
    { url: 'https://example.com', title: 'Example' },
    { url: 'https://github.com', title: 'GitHub' },
  ],
  tags: ['work'],
};

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createDuplicateCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', 'duplicate', ...args]);
}

describe('duplicate command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('duplicates a session with a new name', async () => {
    const duplicated = { ...mockSession, id: 'dup-001', name: 'Work Tabs Copy' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockSession });
    mockedAxios.post.mockResolvedValueOnce({ data: duplicated, status: 201 });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['abc123', 'Work Tabs Copy']);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123')
    );
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('duplicated successfully'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dup-001'));
    consoleSpy.mockRestore();
  });

  it('prints error and exits when session not found', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 }, message: 'Not Found' });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['missing-id', 'Copy'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('prints error and exits on name conflict', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockSession });
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 409 }, message: 'Conflict' });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['abc123', 'Existing Name'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
