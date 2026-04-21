import { Router } from "express";
import { SessionStore } from "../storage/session-store";
import { FocusResult } from "../cli/commands/focus";

export function registerFocusRoute(router: Router, store: SessionStore): void {
  router.post("/:id/focus", async (req, res) => {
    const { id } = req.params;

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: `Session not found: ${id}` });
    }

    // Find and clear any previously focused session
    const allSessions = await store.list();
    let previousFocus: string | null = null;

    for (const s of allSessions) {
      if (s.id !== id && s.metadata?.focused) {
        previousFocus = s.name;
        await store.save({ ...s, metadata: { ...s.metadata, focused: false } });
      }
    }

    const focusedAt = new Date().toISOString();
    const updated = {
      ...session,
      metadata: { ...session.metadata, focused: true, focusedAt },
    };
    await store.save(updated);

    const result: FocusResult = {
      sessionId: id,
      name: session.name,
      focusedAt,
      previousFocus,
    };

    return res.status(200).json(result);
  });
}
