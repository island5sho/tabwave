import { Router, Request, Response } from "express";
import { SessionStore } from "../storage/session-store";
import { computeStats } from "../cli/commands/stats";

export function registerStatsRoute(router: Router, store: SessionStore): void {
  router.get("/sessions/stats", async (_req: Request, res: Response) => {
    try {
      const sessions = await store.getAll();
      const stats = computeStats(sessions);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compute stats", details: err.message });
    }
  });
}
