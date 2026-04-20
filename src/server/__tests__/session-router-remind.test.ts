import express from "express";
import request from "supertest";
import { registerRemindRoute } from "../session-router-remind";
import { SessionStore } from "../../storage/session-store";

function buildApp() {
  const app = express();
  app.use(express.json());
  const store = new SessionStore();
  store.save({
    id: "sess1",
    name: "Work",
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const router = express.Router();
  registerRemindRoute(router, store);
  app.use(router);
  return app;
}

describe("POST /reminders", () => {
  it("creates a reminder for a valid session", async () => {
    const res = await request(buildApp()).post("/reminders").send({
      sessionId: "sess1",
      message: "Review tabs",
      remindAt: "2025-06-01T10:00:00.000Z",
    });
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBe("sess1");
    expect(res.body.message).toBe("Review tabs");
  });

  it("returns 404 for unknown session", async () => {
    const res = await request(buildApp()).post("/reminders").send({
      sessionId: "unknown",
      message: "Hello",
      remindAt: "2025-06-01T10:00:00.000Z",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid date", async () => {
    const res = await request(buildApp()).post("/reminders").send({
      sessionId: "sess1",
      message: "Hello",
      remindAt: "not-a-date",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(buildApp()).post("/reminders").send({ sessionId: "sess1" });
    expect(res.status).toBe(400);
  });
});

describe("GET /reminders", () => {
  it("returns empty array initially", async () => {
    const res = await request(buildApp()).get("/reminders");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("DELETE /reminders/:sessionId", () => {
  it("returns 404 if reminder does not exist", async () => {
    const res = await request(buildApp()).delete("/reminders/sess1");
    expect(res.status).toBe(404);
  });
});
