import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerInspectRoute(router: Router, store: SessionStore): void {
  router.get("/sessions/:id", async (req, res) => {
    try {
      const session = await store.get(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
