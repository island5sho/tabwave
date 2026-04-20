import axios from "axios";
import { createRemindCommand, formatReminder, Reminder } from "../commands/remind";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

async function runCommand(args: string[]): Promise<void> {
  const cmd = createRemindCommand();
  await cmd.parseAsync(["node", "remind", ...args]);
}

describe("formatReminder", () => {
  it("formats a reminder correctly", () => {
    const r: Reminder = { sessionId: "abc", message: "Review tabs", remindAt: "2025-01-01T09:00:00.000Z" };
    const result = formatReminder(r);
    expect(result).toContain("[abc]");
    expect(result).toContain("Review tabs");
  });
});

describe("remind command", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists reminders", async () => {
    const reminders: Reminder[] = [
      { sessionId: "s1", message: "Check work tabs", remindAt: "2025-06-01T10:00:00.000Z" },
    ];
    mockedAxios.get = jest.fn().mockResolvedValue({ data: reminders });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["--list"]);

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("/reminders"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("s1"));
    spy.mockRestore();
  });

  it("shows message when no reminders", async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["--list"]);

    expect(spy).toHaveBeenCalledWith("No reminders set.");
    spy.mockRestore();
  });

  it("sets a reminder", async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({ data: {} });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["--session", "s1", "--message", "Hello", "--time", "2025-06-01T10:00:00.000Z"]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/reminders"),
      expect.objectContaining({ sessionId: "s1", message: "Hello" })
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Reminder set"));
    spy.mockRestore();
  });

  it("deletes a reminder", async () => {
    mockedAxios.delete = jest.fn().mockResolvedValue({ data: {} });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["--delete", "s1"]);

    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining("/reminders/s1"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("deleted"));
    spy.mockRestore();
  });

  it("exits when required args missing for set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runCommand(["--session", "s1"])).rejects.toThrow("exit");
    expect(mockExit).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });
});
