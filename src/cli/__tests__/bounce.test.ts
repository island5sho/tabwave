import axios from 'axios';
import { Command } from 'commander';
import { createBounceCommand } from '../commands/bounce';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (args: string[]): Promise<void> => {
  const program = new Command();
  program.addCommand(createBounceCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', 'bounce', ...args]);
};

describe('bounce command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls deactivate then activate on success', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    await runCommand(['abc123', '--delay', '0']);

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/sessions/abc123/deactivate'
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/sessions/abc123/activate'
    );
  });

  it('uses custom port', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    await runCommand(['abc123', '--port', '4000', '--delay', '0']);

    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'http://localhost:4000/sessions/abc123/deactivate'
    );
  });

  it('exits with code 1 when deactivate fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'not found' } },
    });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(runCommand(['missing', '--delay', '0'])).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
