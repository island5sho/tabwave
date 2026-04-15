export interface Tab {
  url: string;
  title: string;
  pinned?: boolean;
  favicon?: string;
}

export interface Session {
  id: string;
  name: string;
  tabs: Tab[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  archived?: boolean;
  pinned?: boolean;
  locked?: boolean;
  note?: string;
  label?: string;
  favorite?: boolean;
  snapshot?: string;
  history?: HistoryEntry[];
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  tabCount: number;
}

export interface SessionDiff {
  added: Tab[];
  removed: Tab[];
  unchanged: Tab[];
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  resolved: Session;
}

export interface Schedule {
  sessionId: string;
  cron: string;
  action: string;
  enabled: boolean;
}

export interface GroupedSessions {
  [key: string]: Session[];
}
