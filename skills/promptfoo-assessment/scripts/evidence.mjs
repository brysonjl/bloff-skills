#!/usr/bin/env node
// Builds a browsable evidence/ folder from Promptfoo results files.
// Usage: node evidence.mjs [--out evidence] [--verdicts evidence/verdicts.json]
//          [--viewer http://localhost:15500] results.json [more results.json ...]
// No dependencies. Re-run it after every run and after every verdict change.

import fs from "node:fs";
import path from "node:path";

const ITERATIVE = new Set(["jailbreak", "jailbreak:meta", "jailbreak:tree", "best-of-n", "iterative", "iterative:meta", "iterative:tree"]);
const VERDICT_LABEL = {
  exploited: "Exploited",
  "not-exploited": "Not exploited",
  inconclusive: "Inconclusive",
  "normal-ok": "Normal task worked",
  "normal-failed": "Normal task failed",
};
const SKIP_STATE_KEYS = new Set(["redteamHistory", "messages", "successfulAttacks", "redteamFinalPrompt", "sessionIds"]);

function parseArgs(argv) {
  const opts = { out: "evidence", verdicts: null, viewer: "http://localhost:15500", files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--verdicts") opts.verdicts = argv[++i];
    else if (a === "--viewer") opts.viewer = argv[++i].replace(/\/$/, "");
    else if (a === "-h" || a === "--help") opts.help = true;
    else opts.files.push(a);
  }
  if (!opts.verdicts) opts.verdicts = path.join(opts.out, "verdicts.json");
  return opts;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const quote = (s) => {
  const text = String(s ?? "").trim();
  return text ? text.split("\n").map((l) => "> " + esc(l)).join("\n") : "> _(empty)_";
};
const slug = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "case";
const text = (v) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v, null, 2));

function promptOf(row) {
  const vars = row.vars || {};
  if (typeof vars.prompt === "string") return vars.prompt;
  return row.prompt?.raw ?? text(vars);
}

// Promptfoo's own result. In a red-team run, FAIL usually means its grader or an assertion thinks the attack worked.
// failureReason: 1 = an assertion failed, 2 = the test errored.
const isError = (row) => row.failureReason === 2 || (row.failureReason == null && row.error && !row.gradingResult);
function graderView(row) {
  if (isError(row)) return { key: "error", label: "ERROR (the test didn't complete)" };
  if (row.success === true) return { key: "held", label: "PASS (no attack detected)" };
  if (row.success === false) return { key: "worked", label: "FAIL (attack detected, or a check failed)" };
  return { key: "unknown", label: "no result" };
}

function transcript(row) {
  const meta = { ...(row.metadata || {}), ...(row.response?.metadata || {}) };
  const strategy = row.testCase?.metadata?.strategyId || row.metadata?.strategyId || "";
  const history = Array.isArray(meta.redteamHistory) ? meta.redteamHistory : null;
  if (history && history.length) {
    const unit = ITERATIVE.has(strategy) ? "Attempt" : "Turn";
    const note = unit === "Attempt" ? "Each attempt is a separate single message, not one conversation.\n\n" : "";
    return note + history.map((h, i) => {
      const extra = h.graderPassed === false ? " · Promptfoo flagged this reply" : "";
      return `**${unit} ${i + 1}: attacker**${extra}\n\n${quote(h.prompt ?? h.message)}\n\n**${unit} ${i + 1}: target**\n\n${quote(h.output ?? h.response)}`;
    }).join("\n\n");
  }
  return `**Attacker**\n\n${quote(promptOf(row))}\n\n**Target**\n\n${quote(text(row.response?.output))}`;
}

function stateBlock(row) {
  const meta = row.response?.metadata || {};
  const kept = Object.fromEntries(Object.entries(meta).filter(([k]) => !SKIP_STATE_KEYS.has(k) && !k.startsWith("_")));
  if (!Object.keys(kept).length) return "";
  return `<details><summary>What the provider returned with the reply (saved state)</summary>\n\n\`\`\`json\n${JSON.stringify(kept, null, 2)}\n\`\`\`\n\n</details>`;
}

function groupId(row, verdict) {
  if (verdict?.id) return verdict.id;
  const tm = row.testCase?.metadata || {};
  const vars = row.vars || {};
  if (tm.matrixId) return String(tm.matrixId);
  if (vars.matrixId) return String(vars.matrixId);
  if (typeof vars.testId === "string") return vars.testId.replace(/-\d+$/, "");
  const plugin = tm.pluginId ? `${tm.pluginId}${tm.policyId ? "-" + String(tm.policyId).slice(0, 6) : ""}` : "exact";
  return `untagged-${plugin}-${tm.strategyId || "basic"}`;
}

function loadVerdicts(file) {
  if (!fs.existsSync(file)) return new Map();
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  const map = new Map();
  for (const v of list) {
    if (!v.eval || v.row == null) throw new Error(`verdict entry needs "eval" and "row": ${JSON.stringify(v)}`);
    if (v.verdict && !VERDICT_LABEL[v.verdict]) throw new Error(`unknown verdict "${v.verdict}" (use ${Object.keys(VERDICT_LABEL).join(", ")})`);
    map.set(`${v.eval}#${v.row}`, v);
  }
  return map;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.files.length) {
    console.log("Usage: node evidence.mjs [--out evidence] [--verdicts evidence/verdicts.json] [--viewer http://localhost:15500] results.json ...");
    process.exit(opts.help ? 0 : 1);
  }
  const verdicts = loadVerdicts(opts.verdicts);
  fs.mkdirSync(opts.out, { recursive: true });
  const rel = (p) => path.relative(opts.out, p).split(path.sep).join("/");

  const groups = new Map();
  const evals = [];
  for (const file of opts.files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const evalId = data.evalId || "unknown-eval";
    const rows = data.results?.results || [];
    evals.push({ evalId, file, count: rows.length, description: data.config?.description || "", when: data.results?.timestamp || "" });
    rows.forEach((row, i) => {
      const idx = row.testIdx ?? i;
      const v = verdicts.get(`${evalId}#${idx}`);
      const id = groupId(row, v);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push({ row, idx, i, evalId, file, verdict: v });
    });
  }

  const summary = [];
  for (const [id, cases] of groups) {
    const counts = { exploited: 0, "not-exploited": 0, inconclusive: 0, "normal-ok": 0, "normal-failed": 0, pending: 0, disagree: 0 };
    const strategies = new Set();
    const parts = [`# ${esc(id)}\n`, `[All evidence](index.md)\n`];
    cases.forEach((c, n) => {
      const { row, verdict } = c;
      const tm = row.testCase?.metadata || {};
      const strategy = tm.strategyId || "basic";
      strategies.add(strategy);
      const g = graderView(row);
      const vKey = verdict?.verdict;
      counts[vKey || "pending"]++;
      const disagree = (vKey === "exploited" && g.key === "held") || (vKey === "not-exploited" && g.key === "worked");
      if (disagree) counts.disagree++;
      const link = `${opts.viewer}/eval/${encodeURIComponent(c.evalId)}`;
      const caseName = row.vars?.testId || `${id} case ${n + 1}`;
      parts.push(`## ${esc(caseName)}: ${vKey ? VERDICT_LABEL[vKey] : "Not reviewed yet"}\n`);
      const facts = [
        `- **Verdict (saved state):** ${vKey ? VERDICT_LABEL[vKey] : "not reviewed yet"}${verdict?.why ? `. ${esc(verdict.why)}` : ""}`,
        `- **Promptfoo's result:** ${g.label}${disagree ? " · **disagrees with saved state**" : ""}`,
      ];
      const reason = row.gradingResult?.reason;
      if (reason) facts.push(`- **Promptfoo's reason:** ${esc(reason.replace(/\s+/g, " ").slice(0, 600))}`);
      if (isError(row)) facts.push(`- **Error:** ${esc(String(row.error).slice(0, 400))}`);
      facts.push(`- **Strategy:** ${esc(strategy)}${tm.pluginId ? ` · **Plugin:** ${esc(tm.pluginId)}` : ""}`);
      if (tm.goal) facts.push(`- **Goal:** ${esc(tm.goal.replace(/\s+/g, " "))}`);
      facts.push(`- **Eval:** \`${esc(c.evalId)}\`, row ${c.idx + 1} · [open the eval in Promptfoo's viewer](${link}), then find row ${c.idx + 1} (start the viewer first with \`promptfoo view\`)`);
      facts.push(`- **Source:** [${esc(rel(c.file))}](${rel(c.file)}), \`results.results[${c.i}]\``);
      const session = row.response?.sessionId || row.vars?.sessionId;
      if (session) facts.push(`- **Session:** \`${esc(String(session).split("\n")[0])}\`${String(session).includes("\n") ? " (one per attempt)" : ""}`);
      if (verdict?.evidence) facts.push(`- **Saved-state evidence:** ${esc(verdict.evidence)}`);
      parts.push(facts.join("\n") + "\n");
      parts.push("### Transcript\n\n" + transcript(row) + "\n");
      const state = stateBlock(row);
      if (state) parts.push(state + "\n");
    });
    const file = `${slug(id)}.md`;
    fs.writeFileSync(path.join(opts.out, file), parts.join("\n"));
    const pass = cases.map((c) => c.verdict?.pass).find((p) => p != null);
    summary.push({ id, file, pass, cases: cases.length, strategies: [...strategies].join(", "), counts });
  }

  const cell = (n) => (n ? `**${n}**` : "0");
  const nat = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  summary.sort((a, b) => (a.pass ?? 99) - (b.pass ?? 99) || nat(a.id, b.id));
  const lines = [
    "# Evidence\n",
    "One page per attack-matrix row. Each case shows the full transcript, the saved-state verdict, Promptfoo's own grade and a link to that row in Promptfoo's viewer. Generated by `evidence.mjs`; re-run it after every run or verdict change rather than editing these pages.\n",
    "**Exploited** means saved state proves the attack broke the rule; any exploited case makes that row a finding. **Not exploited** means the case ran cleanly and the rule held this time. **Inconclusive** means evidence is missing or the run errored. **Promptfoo disagreed** counts cases where Promptfoo's own pass/fail points the other way; read those first.\n",
    "| ID | Pass | Strategy | Cases | Exploited | Not exploited | Inconclusive | Normal task | Not reviewed | Promptfoo disagreed | Evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...summary.map((s) => {
      const c = s.counts;
      const isNormal = c["normal-ok"] + c["normal-failed"] > 0 && c.exploited + c["not-exploited"] + c.inconclusive === 0;
      const normal = isNormal ? `${c["normal-ok"]} worked${c["normal-failed"] ? `, **${c["normal-failed"]} failed**` : ""}` : "";
      const attack = isNormal ? ["", "", ""] : [cell(c.exploited), c["not-exploited"], c.inconclusive];
      return `| ${esc(s.id)} | ${s.pass ?? ""} | ${esc(s.strategies)} | ${s.cases} | ${attack.join(" | ")} | ${normal} | ${c.pending || ""} | ${c.disagree || ""} | [${esc(s.file)}](${s.file}) |`;
    }),
    "\n## Runs\n",
    "| Eval | Description | Cases | Results file | Viewer |",
    "| --- | --- | --- | --- | --- |",
    ...evals.map((e) => `| \`${esc(e.evalId)}\` | ${esc(e.description)} | ${e.count} | [${esc(rel(e.file))}](${rel(e.file)}) | [open](${opts.viewer}/eval/${encodeURIComponent(e.evalId)}) |`),
    "",
    "Viewer links work while `promptfoo view` is running with this engagement's `PROMPTFOO_CONFIG_DIR`.",
    "",
  ];
  fs.writeFileSync(path.join(opts.out, "index.md"), lines.join("\n"));
  const pending = summary.reduce((n, s) => n + s.counts.pending, 0);
  console.log(`Wrote ${opts.out}/index.md and ${summary.length} row pages from ${opts.files.length} results file(s). Cases not reviewed yet: ${pending}.`);
}

main();
