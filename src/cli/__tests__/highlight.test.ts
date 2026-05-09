import axios from 'axios';
import { Command } from 'commander';
import { createHighlightCommand, printHighlight } from '../commands/highlight';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`process.exit(${code})`);
});

const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createHighlightCommand());
  await program.parseAsync(['node', 'test', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('printHighlight', () => {
  it('prints session id and tab info', () => {
    printHighlight({ url: 'https://example.com', title: 'Example' }, 'abc123');
    expect(mockLog).toHaveBeenCalledWith('[abc123] ★ Example');
    expect(mockLog).toHaveBeenCalledWith('    https://example.com');
  });
});

describe('highlight command', () => {
  it('highlights a tab by index', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { tab: { url: 'https://example.com', title: 'Example', highlighted: true } },
    });

    await runCommand(['highlight', 'sess1', '0']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/sess1/highlight',
      { tabIndex: 0 }
    );
    expect(mockLog).toHaveBeenCalledWith('[sess1] ★ Example');
  });

  it('exits on invalid tab index', async () => {
    await expect(runCommand(['highlight', 'sess1', '-1'])).rejects.toThrow('process.exit(1)');
    expect(mockError).toHaveBeenCalledWith('Invalid tab index');
  });

  it('exits on server error', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'Session not found' } },
    });

    await expect(runCommand(['highlight', 'missing', '0'])).rejects.toThrow('process.exit(1)');
    expect(mockError).toHaveBeenCalledWith('Error: Session not found');
  });

  it('uses custom port', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { tab: { url: 'https://test.com', title: 'Test', highlighted: true } },
    });

    await runCommand(['highlight', 'sess2', '1', '--port', '4000']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/sess2/highlight',
      { tabIndex: 1 }
    );
  });
});
