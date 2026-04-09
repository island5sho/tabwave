import { createImportCommand } from '../commands/import';
import axios from 'axios';
import * as fs from 'fs';
import { TabSession } from '../../types/session';
import { validateSession } from '../../utils/session-validator';

jest.mock('axios');
jest.mock('fs');
jest.mock('../../utils/session-validator');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedValidate = validateSession as jest.MockedFunction<typeof validateSession>;

const mockSession: TabSession = {
  name: 'work',
  tabs: [
    { url: 'https://github.com', title: 'GitHub', pinned: false },
    { url: 'https://notion.so', title: 'Notion', pinned: false },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function runCommand(args: string[]): Promise<void> {
  const cmd = createImportCommand();
  return cmd.parseAsync(args, { from: 'user' });
}

beforeEach(() => {
  jest.clearAllMocks();
  (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
  (mockedFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSession));
  mockedValidate.mockReturnValue([]);
  mockedAxios.get.mockRejectedValue({ response: { status: 404 } });
  mockedAxios.put.mockResolvedValue({ status: 200 });
});

describe('import command', () => {
  it('imports a valid session file', async () => {
    await runCommand(['work-session.json']);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/work',
      mockSession
    );
  });

  it('exits if file does not exist', async () => {
    (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['missing.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if file contains invalid JSON', async () => {
    (mockedFs.readFileSync as jest.Mock).mockReturnValue('not-json');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['bad.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if session validation fails', async () => {
    mockedValidate.mockReturnValue(['Missing name', 'Missing tabs']);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['bad-session.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if session exists and --overwrite not set', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: mockSession });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['work-session.json'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('overwrites existing session when --overwrite flag is set', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: mockSession });
    await runCommand(['work-session.json', '--overwrite']);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/work',
      mockSession
    );
  });
});
