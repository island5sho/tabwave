import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerFreezeRoute(router: Router, store: SessionStore): void {
  router.patch("/sessions/:id/freeze", async (req, res) => {
    const { id } = req.params;
    const { frozen } = req.body;

    if (typeof frozen !== "boolean") {
      res.status(400).json({ error: "'frozen' must be a boolean" });
      return;
    }

    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const updated = {
      ...session,
      frozen,
      updatedAt: new Date().toISOString(),
    };

    await store.save(updated);
    res.json(updated);
  });
}
