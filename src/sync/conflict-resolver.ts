import { Session, Tab } from '../types/session';
import { diffSessions, hasDiff } from './session-diff';

export type ConflictStrategy = 'local-wins' | 'remote-wins' | 'merge-newest';

export interface ConflictResult {
  resolved: Session;
  strategy: ConflictStrategy;
  hadConflict: boolean;
}

/**
 * Resolves conflicts between a local and remote session.
 * Returns a resolved session based on the chosen strategy.
 */
export function resolveConflict(
  local: Session,
  remote: Session,
  strategy: ConflictStrategy = 'merge-newest'
): ConflictResult {
  const diff = diffSessions(local, remote);
  const hadConflict = hasDiff(diff);

  if (!hadConflict) {
    return { resolved: local, strategy, hadConflict: false };
  }

  let resolved: Session;

  switch (strategy) {
    case 'local-wins':
      resolved = { ...local };
      break;

    case 'remote-wins':
      resolved = { ...remote };
      break;

    case 'merge-newest':
    default:
      resolved = mergeByNewest(local, remote);
      break;
  }

  return { resolved, strategy, hadConflict };
}

function mergeByNewest(local: Session, remote: Session): Session {
  const base = local.updatedAt >= remote.updatedAt ? local : remote;
  const other = base === local ? remote : local;

  const tabMap = new Map<string, Tab>();

  for (const tab of other.tabs) {
    tabMap.set(tab.url, tab);
  }

  // Overwrite with tabs from the newer session, preserving unique tabs from older
  for (const tab of base.tabs) {
    tabMap.set(tab.url, tab);
  }

  return {
    ...base,
    tabs: Array.from(tabMap.values()),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}
