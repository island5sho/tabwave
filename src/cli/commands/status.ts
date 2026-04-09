import axios from 'axios';
import { Session } from '../../types/session';
import { SessionStore } from '../../storage/session-store';
import { diffSessions } from '../../sync/session-diff';
import { summarizeSession } from '../../storage/session-store-helpers';

export interface StatusOptions {
  serverUrl: string;
  deviceId: string;
}

export interface StatusResult {
  deviceId: string;
  localSummary: string | null;
  remoteSummary: string | null;
  inSync: boolean;
  addedTabs: number;
  removedTabs: number;
}

export async function getStatus(
  store: SessionStore,
  options: StatusOptions
): Promise<StatusResult> {
  const { serverUrl, deviceId } = options;

  const localSession = store.get(deviceId) ?? null;

  let remoteSession: Session | null = null;
  try {
    const response = await axios.get<Session>(`${serverUrl}/sessions/${deviceId}`);
    remoteSession = response.data;
  } catch (err: any) {
    if (!err.response || err.response.status !== 404) {
      throw new Error(`Failed to reach server: ${err.message}`);
    }
  }

  if (!localSession && !remoteSession) {
    return {
      deviceId,
      localSummary: null,
      remoteSummary: null,
      inSync: true,
      addedTabs: 0,
      removedTabs: 0,
    };
  }

  if (!localSession || !remoteSession) {
    return {
      deviceId,
      localSummary: localSession ? summarizeSession(localSession) : null,
      remoteSummary: remoteSession ? summarizeSession(remoteSession) : null,
      inSync: false,
      addedTabs: remoteSession?.tabs.length ?? 0,
      removedTabs: localSession?.tabs.length ?? 0,
    };
  }

  const diff = diffSessions(localSession, remoteSession);
  return {
    deviceId,
    localSummary: summarizeSession(localSession),
    remoteSummary: summarizeSession(remoteSession),
    inSync: diff.added.length === 0 && diff.removed.length === 0,
    addedTabs: diff.added.length,
    removedTabs: diff.removed.length,
  };
}
