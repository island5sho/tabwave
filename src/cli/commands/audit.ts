import axios from "axios";
import { Command } from "commander";

export interface AuditResult {
  sessionId: string;
  name: string;
  issues: string[];
}

export function printAuditResult(result: AuditResult): void {
  if (result.issues.length === 0) {
    console.log(`✅ [${result.name}] No issues found.`);
  } else {
    console.log(`⚠️  [${result.name}] ${result.issues.length} issue(s):`);
    result.issues.forEach((issue) => console.log(`   - ${issue}`));
  }
}

export function createAuditCommand(): Command {
  const cmd = new Command("audit");

  cmd
    .description("Audit sessions for common issues like duplicate tabs, empty sessions, or broken URLs")
    .option("-s, --session <id>", "Audit a specific session by ID")
    .option("--fix", "Automatically remove duplicate tabs where possible")
    .action(async (opts) => {
      try {
        const params: Record<string, string> = {};
        if (opts.session) params.id = opts.session;
        if (opts.fix) params.fix = "true";

        const res = await axios.get("http://localhost:3000/sessions/audit", { params });
        const results: AuditResult[] = res.data.results;

        if (results.length === 0) {
          console.log("No sessions found.");
          return;
        }

        results.forEach(printAuditResult);

        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        console.log(`\nAudit complete. ${results.length} session(s) checked, ${totalIssues} total issue(s).`);
      } catch (err: any) {
        console.error("Audit failed:", err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });

  return cmd;
}
