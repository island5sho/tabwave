import { Session, Tab } from '../types/session';

export interface SessionDiff {
  added: Tab[];
  removed: Tab[];
  updated: Tab[];
  unchanged: Tab[];
}

export function diffSessions(local: Session, remote: Session): SessionDiff {
  const localTabMap = new Map(local.tabs.map((t) => [t.id, t]));
  const remoteTabMap = new Map(remote.tabs.map((t) => [t.id, t]));

  const added: Tab[] = [];
  const removed: Tab[] = [];
  const updated: Tab[] = [];
  const unchanged: Tab[] = [];

  for (const [id, remoteTab] of remoteTabMap) {
    if (!localTabMap.has(id)) {
      added.push(remoteTab);
    } else {
      const localTab = localTabMap.get(id)!;
      if (
        localTab.url !== remoteTab.url ||
        localTab.title !== remoteTab.title ||
        localTab.pinned !== remoteTab.pinned
      ) {
        updated.push(remoteTab);
      } else {
        unchanged.push(remoteTab);
      }
    }
  }

  for (const [id, localTab] of localTabMap) {
    if (!remoteTabMap.has(id)) {
      removed.push(localTab);
    }
  }

  return { added, removed, updated, unchanged };
}

export function hasDiff(diff: SessionDiff): boolean {
  return (
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    diff.updated.length > 0
  );
}

export function applyDiff(base: Session, diff: SessionDiff): Session {
  const removedIds = new Set(diff.removed.map((t) => t.id));
  const updatedMap = new Map(diff.updated.map((t) => [t.id, t]));

  const survivingTabs = base.tabs
    .filter((t) => !removedIds.has(t.id))
    .map((t) => updatedMap.get(t.id) ?? t);

  return {
    ...base,
    tabs: [...survivingTabs, ...diff.added],
    updatedAt: new Date().toISOString(),
  };
}
