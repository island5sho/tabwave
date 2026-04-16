import axios from 'axios';
import { Command } from 'commander';
import { createReorderCommand } from '../commands/reorder';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => { throw new Error(`exit:${code}`); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockErr = jest.spyOn(console, 'error').mockImplementation(() => {});

async function run(args: string[]) {
  const program = new Command();
  program.addCommand(createReorderCommand());
  await program.parseAsync(['node', 'test', 'reorder', ...args]);
}

beforeEach(() => jest.clearAllMocks());

describe('reorder command', () => {
  it('reorders tabs and prints result', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        tabs: [
          { url: 'https://b.com', title: 'B' },
          { url: 'https://a.com', title: 'A' },
        ],
      },
    });

    await run(['sess1', '0', '1']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/sess1/reorder',
      { from: 0, to: 1 }
    );
    expect(mockLog).toHaveBeenCalledWith('Tabs reordered in session "sess1":');
    expect(mockLog).toHaveBeenCalledWith('  [0] B');
    expect(mockLog).toHaveBeenCalledWith('  [1] A');
  });

  it('exits on invalid index args', async () => {
    await expect(run(['sess1', 'abc', '1'])).rejects.toThrow('exit:1');
    expect(mockErr).toHaveBeenCalledWith('Error: fromIndex and toIndex must be integers');
  });

  it('exits on server error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Index out of range' } },
      message: 'Request failed',
    });

    await expect(run(['sess1', '0', '99'])).rejects.toThrow('exit:1');
    expect(mockErr).toHaveBeenCalledWith('Error: Index out of range');
  });
});
