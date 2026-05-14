import axios from 'axios';
import { createReactivateCommand } from '../commands/reactivate';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeSession = (id: string, name: string, active: boolean, tags: string[] = []) => ({
  id,
  name,
  active,
  tags,
  tabs: [],
  updatedAt: new Date().toISOString(),
});

async function runCommand(args: string[]) {
  const cmd = createReactivateCommand();
  await cmd.parseAsync(['node', 'reactivate', ...args]);
}

describe('reactivate command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reactivates all dormant sessions', async () => {
    const sessions = [
      makeSession('s1', 'Alpha', false),
      makeSession('s2', 'Beta', true),
      makeSession('s3', 'Gamma', false),
    ];
    mockedAxios.get.mockResolvedValue({ data: sessions });
    mockedAxios.patch.mockResolvedValue({ data: {} });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand([]);

    expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Reactivated 2 of 2'));
    spy.mockRestore();
  });

  it('prints message when no dormant sessions exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeSession('s1', 'Alpha', true)] });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand([]);

    expect(mockedAxios.patch).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('No dormant sessions found.');
    spy.mockRestore();
  });

  it('filters by tag when --tag is provided', async () => {
    const sessions = [
      makeSession('s1', 'Alpha', false, ['work']),
      makeSession('s2', 'Beta', false, ['personal']),
    ];
    mockedAxios.get.mockResolvedValue({ data: sessions });
    mockedAxios.patch.mockResolvedValue({ data: {} });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['--tag', 'work']);

    expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
    expect(mockedAxios.patch).toHaveBeenCalledWith(expect.stringContaining('s1/activate'));
    spy.mockRestore();
  });

  it('shows preview without patching when --dry-run is set', async () => {
    const sessions = [makeSession('s1', 'Alpha', false)];
    mockedAxios.get.mockResolvedValue({ data: sessions });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['--dry-run']);

    expect(mockedAxios.patch).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Would reactivate 1'));
    spy.mockRestore();
  });

  it('exits with code 1 on server error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('connection refused'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand([])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
