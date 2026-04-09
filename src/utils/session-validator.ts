/**
 * Validation utilities for session data
 */

import { Session, Tab, Window, SessionMetadata, Device } from '../types/session';

export class SessionValidator {
  /**
   * Validates a complete session object
   */
  static validateSession(session: Session): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!session.id || typeof session.id !== 'string') {
      errors.push('Session must have a valid id');
    }

    if (!session.deviceId || typeof session.deviceId !== 'string') {
      errors.push('Session must have a valid deviceId');
    }

    if (!session.deviceName || typeof session.deviceName !== 'string') {
      errors.push('Session must have a valid deviceName');
    }

    if (!Array.isArray(session.windows)) {
      errors.push('Session must have a windows array');
    } else {
      session.windows.forEach((window, idx) => {
        const windowErrors = this.validateWindow(window);
        if (!windowErrors.valid) {
          errors.push(`Window ${idx}: ${windowErrors.errors.join(', ')}`);
        }
      });
    }

    if (!session.timestamp || typeof session.timestamp !== 'number') {
      errors.push('Session must have a valid timestamp');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates a window object
   */
  static validateWindow(window: Window): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!window.id || typeof window.id !== 'string') {
      errors.push('Window must have a valid id');
    }

    if (!Array.isArray(window.tabs)) {
      errors.push('Window must have a tabs array');
    } else {
      window.tabs.forEach((tab, idx) => {
        const tabErrors = this.validateTab(tab);
        if (!tabErrors.valid) {
          errors.push(`Tab ${idx}: ${tabErrors.errors.join(', ')}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates a tab object
   */
  static validateTab(tab: Tab): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tab.id || typeof tab.id !== 'string') {
      errors.push('Tab must have a valid id');
    }

    if (!tab.url || typeof tab.url !== 'string') {
      errors.push('Tab must have a valid url');
    }

    if (typeof tab.title !== 'string') {
      errors.push('Tab must have a title');
    }

    if (!tab.windowId || typeof tab.windowId !== 'string') {
      errors.push('Tab must have a valid windowId');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Sanitizes session data by removing invalid entries
   */
  static sanitizeSession(session: Session): Session {
    return {
      ...session,
      windows: session.windows
        .filter(window => window.id && Array.isArray(window.tabs))
        .map(window => ({
          ...window,
          tabs: window.tabs.filter(tab => tab.id && tab.url && tab.windowId)
        }))
    };
  }
}
