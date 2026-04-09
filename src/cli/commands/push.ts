import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Session } from '../../types/session';
import { validateSession } from '../../utils/session-validator';

const DEFAULT_SERVER_URL = 'http://localhost:3000';

export interface PushOptions {
  file?: string;
  serverUrl?: string;
  deviceId: string;
}

export async function pushSession(options: PushOptions): Promise<void> {
  const serverUrl = options.serverUrl ?? DEFAULT_SERVER_URL;

  let session: Session;

  if (options.file) {
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Session file not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    session = JSON.parse(raw) as Session;
  } else {
    throw new Error('No session source provided. Use --file to specify a session JSON file.');
  }

  const errors = validateSession(session);
  if (errors.length > 0) {
    throw new Error(`Invalid session:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  session.deviceId = options.deviceId;
  session.updatedAt = new Date().toISOString();

  try {
    const response = await axios.post(`${serverUrl}/sessions`, session, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`Session "${session.id}" pushed successfully to ${serverUrl}`);
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.error ?? err.message;
      throw new Error(`Failed to push session: ${msg}`);
    }
    throw err;
  }
}
