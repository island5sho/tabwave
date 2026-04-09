import axios from 'axios';
import { Session } from '../../types/session';
import { SessionStore } from '../../storage/session-store';
import { resolveConflict } from '../../sync/conflict-resolver';
import { hasDiff } from '../../sync/session-diff';

export interface PullOptions {
  serverUrl: string;
  deviceId: string;
  force?: boolean;
}

export async function pullSession(
  store: SessionStore,
  options: PullOptions
): Promise<{ updated: boolean; session: Session }> {
  const { serverUrl, deviceId, force = false } = options;

  let remoteSession: Session;
  try {
    const response = await axios.get<Session>(
      `${serverUrl}/sessions/${deviceId}`
    );
    remoteSession = response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error(`No remote session found for device: ${deviceId}`);
    }
    throw new Error(`Failed to fetch remote session: ${err.message}`);
  }

  const localSession = store.get(deviceId);

  if (!localSession) {
    store.save(remoteSession);
    return { updated: true, session: remoteSession };
  }

  if (!hasDiff(localSession, remoteSession)) {
    return { updated: false, session: localSession };
  }

  const resolved = force
    ? remoteSession
    : resolveConflict(localSession, remoteSession);

  store.save(resolved);
  return { updated: true, session: resolved };
}
