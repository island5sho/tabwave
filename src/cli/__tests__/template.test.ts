import { listTemplates, createTemplateCommand } from '../commands/template';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => jest.clearAllMocks());

describe('listTemplates', () => {
  it('prints all built-in templates', () => {
    listTemplates();
    expect(mockLog).toHaveBeenCalledWith('Available templates:');
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('dev'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('research'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('social'));
  });
});

describe('template apply command', () => {
  async function runApply(templateName: string, sessionName: string) {
    const cmd = createTemplateCommand();
    await cmd.parseAsync(['node', 'test', 'apply', templateName, sessionName]);
  }

  it('creates a session from a valid template', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'abc-123' } });
    await runApply('dev', 'my-dev');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions'),
      expect.objectContaining({ name: 'my-dev', tags: ['dev'] })
    );
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('abc-123'));
  });

  it('exits with error for unknown template', async () => {
    await expect(runApply('nonexistent', 'test')).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Unknown template'));
  });

  it('exits with error when server call fails', async () => {
    mockedAxios.post.mockRejectedValue({ message: 'Network Error', response: undefined });
    await expect(runApply('research', 'my-research')).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Failed to create session'));
  });

  it('includes correct tab count for research template', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'xyz-456' } });
    await runApply('research', 'r-session');
    const callArg = mockedAxios.post.mock.calls[0][1] as any;
    expect(callArg.tabs).toHaveLength(3);
    expect(callArg.tabs[0].url).toBe('https://scholar.google.com');
  });
});

describe('template list command', () => {
  it('lists templates without error', async () => {
    const cmd = createTemplateCommand();
    await cmd.parseAsync(['node', 'test', 'list']);
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('dev'));
  });
});
