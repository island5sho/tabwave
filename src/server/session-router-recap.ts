import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerRecapRoute(router: Router, store: SessionStore): void {
  router.get("/sessions/recap", async (_req, res) => {
    try {
      const sessions = await store.getAll();

      const totalTabs = sessions.reduce((sum, s) => sum + s.tabs.length, 0);
      const pinned = sessions.filter((s) => s.pinned).length;
      const archived = sessions.filter((s) => s.archived).length;
      const tagged = sessions.filter(
        (s) => s.tags && s.tags.length > 0
      ).length;

      const topSession =
        sessions.length > 0
          ? [...sessions].sort((a, b) => b.tabs.length - a.tabs.length)[0]
          : null;

      res.json({
        totalSessions: sessions.length,
        totalTabs,
        pinned,
        archived,
        tagged,
        avgTabsPerSession:
          sessions.length > 0
            ? parseFloat((totalTabs / sessions.length).toFixed(1))
            : 0,
        topSession: topSession
          ? { name: topSession.name, tabCount: topSession.tabs.length }
          : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
