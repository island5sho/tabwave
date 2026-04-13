import axios from 'axios';
import { Command } from 'commander';
import { createLabelCommand } from '../commands/label';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = (labels: string[] = []) => ({
  id: 'sess-1',
  name: 'Test',
  tabs: [],
  labels,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createLabelCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', 'label', ...args]);
}

describe('label command', () => {
  afterEach(() => jest.clearAllMocks());

  it('lists labels when --list flag is used', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession(['work', 'research']) });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['sess-1', '--list']);

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/sessions/sess-1'));
    expect(spy).toHaveBeenCalledWith('Labels:', 'work, research');
    spy.mockRestore();
  });

  it('prints no labels message when session has none', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession([]) });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['sess-1', '--list']);

    expect(spy).toHaveBeenCalledWith('No labels set.');
    spy.mockRestore();
  });

  it('adds labels via --add', async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession(['urgent']) });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['sess-1', '--add', 'urgent']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/sess-1/labels'),
      expect.objectContaining({ add: ['urgent'], remove: [] })
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('urgent'));
    spy.mockRestore();
  });

  it('removes labels via --remove', async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession([]) });
    const spy = jest.spyOn(console, 'log').mockImplementation();

    await runCommand(['sess-1', '--remove', 'urgent']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/sess-1/labels'),
      expect.objectContaining({ add: [], remove: ['urgent'] })
    );
    spy.mockRestore();
  });

  it('exits with error when no flags provided', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const spy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runCommand(['sess-1'])).rejects.toThrow('exit');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('--add'));

    spy.mockRestore();
    mockExit.mockRestore();
  });
});
