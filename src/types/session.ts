/**
 * Type definitions for browser tab sessions
 */

export interface Tab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
  index: number;
  windowId: string;
  lastAccessed: number;
}

export interface Window {
  id: string;
  tabs: Tab[];
  focused: boolean;
  incognito: boolean;
  type: 'normal' | 'popup' | 'panel' | 'app';
}

export interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  windows: Window[];
  timestamp: number;
  version: string;
}

export interface SessionMetadata {
  id: string;
  deviceId: string;
  deviceName: string;
  tabCount: number;
  windowCount: number;
  timestamp: number;
  lastSynced?: number;
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  browser: string;
  lastSeen: number;
  active: boolean;
}

export interface SyncConfig {
  serverUrl: string;
  deviceId: string;
  deviceName: string;
  syncInterval: number;
  autoSync: boolean;
  port: number;
}

export type SessionEvent = 'created' | 'updated' | 'deleted' | 'synced';

export interface SessionEventPayload {
  event: SessionEvent;
  sessionId: string;
  deviceId: string;
  timestamp: number;
}
