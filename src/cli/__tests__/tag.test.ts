import axios from 'axios';
import { Command } from 'commander';
import { createTagCommand } from '../commands/tag';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = {
  id: 'abc123',
  name: 'Work Session',
  tabs: [],
  tags: ['work', 'research'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createTagCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', ...args]);
}

describe('tag command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists tags for a session', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['tag', 'abc123', '--list']);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123')
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('work'));
    spy.mockRestore();
  });

  it('adds tags to a session', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSession });
    mockedAxios.patch = jest.fn().mockResolvedValue({
      data: { ...mockSession, tags: ['work', 'research', 'urgent'] },
    });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['tag', 'abc123', '--add', 'urgent']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123'),
      { tags: ['work', 'research', 'urgent'] }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('urgent'));
    spy.mockRestore();
  });

  it('removes tags from a session', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSession });
    mockedAxios.patch = jest.fn().mockResolvedValue({
      data: { ...mockSession, tags: ['research'] },
    });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['tag', 'abc123', '--remove', 'work']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123'),
      { tags: ['research'] }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('research'));
    spy.mockRestore();
  });

  it('prints error and exits on server failure', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue({
      message: 'Network Error',
      response: { data: { error: 'Session not found' } },
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['tag', 'missing', '--list'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Session not found'));

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
