import { Router } from "express";
import { SessionStore } from "../storage/session-store";
import { Reminder } from "../cli/commands/remind";

const reminders: Map<string, Reminder> = new Map();

export function registerRemindRoute(router: Router, store: SessionStore): void {
  router.get("/reminders", (_req, res) => {
    res.json(Array.from(reminders.values()));
  });

  router.post("/reminders", (req, res) => {
    const { sessionId, message, remindAt } = req.body as Reminder;

    if (!sessionId || !message || !remindAt) {
      return res.status(400).json({ error: "sessionId, message, and remindAt are required" });
    }

    const session = store.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: `Session "${sessionId}" not found` });
    }

    const date = new Date(remindAt);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "remindAt must be a valid ISO date string" });
    }

    const reminder: Reminder = { sessionId, message, remindAt };
    reminders.set(sessionId, reminder);
    res.status(201).json(reminder);
  });

  router.delete("/reminders/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    if (!reminders.has(sessionId)) {
      return res.status(404).json({ error: `No reminder found for session "${sessionId}"` });
    }
    reminders.delete(sessionId);
    res.json({ deleted: sessionId });
  });
}
