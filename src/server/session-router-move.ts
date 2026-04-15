import { Router, Request, Response } from "express";
import { SessionStore } from "../storage/session-store";

export function registerMoveRoute(router: Router, store: SessionStore): void {
  router.post("/sessions/move", async (req: Request, res: Response) => {
    const { sourceSession, tabIndex, targetSession, position } = req.body as {
      sourceSession: string;
      tabIndex: number;
      targetSession: string;
      position?: number;
    };

    if (!sourceSession || !targetSession || tabIndex === undefined) {
      return res.status(400).json({ error: "sourceSession, tabIndex, and targetSession are required." });
    }

    const src = await store.get(sourceSession);
    if (!src) {
      return res.status(404).json({ error: `Session "${sourceSession}" not found.` });
    }

    const dest = await store.get(targetSession);
    if (!dest) {
      return res.status(404).json({ error: `Session "${targetSession}" not found.` });
    }

    if (tabIndex < 0 || tabIndex >= src.tabs.length) {
      return res.status(400).json({ error: `tabIndex ${tabIndex} is out of range for session "${sourceSession}".` });
    }

    const [tab] = src.tabs.splice(tabIndex, 1);
    src.updatedAt = new Date().toISOString();

    const insertAt = position !== undefined
      ? Math.max(0, Math.min(position, dest.tabs.length))
      : dest.tabs.length;

    dest.tabs.splice(insertAt, 0, tab);
    dest.updatedAt = new Date().toISOString();

    await store.save(src);
    await store.save(dest);

    return res.status(200).json({ tab, targetSession });
  });
}
