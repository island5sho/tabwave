export interface Tab {
  url: string;
  title: string;
  pinned?: boolean;
  highlighted?: boolean;
  bookmarked?: boolean;
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  detail?: string;
}

export interface Session {
  id: string;
  name: string;
  tabs: Tab[];
  tags?: string[];
  labels?: string[];
  note?: string;
  pinned?: boolean;
  archived?: boolean;
  locked?: boolean;
  frozen?: boolean;
  active?: boolean;
  protected?: boolean;
  favorite?: boolean;
  published?: boolean;
  shareToken?: string;
  alias?: string;
  reminder?: string;
  schedule?: string;
  expireAt?: string;
  annotation?: string;
  templateName?: string;
  history?: HistoryEntry[];
  snapshot?: Session;
  createdAt: string;
  updatedAt: string;
}
