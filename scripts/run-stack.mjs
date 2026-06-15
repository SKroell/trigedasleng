#!/usr/bin/env node
/**
 * run-stack.mjs <dev|start> — run the web app and the Python RAG service together
 * (no Docker). One Ctrl-C stops both; logs are prefixed [web] / [service].
 *
 *   dev   : react-router dev server (HMR) + uvicorn
 *   start : production — react-router-serve (needs `npm run build` first) + uvicorn
 *
 * The RAG service binds 127.0.0.1 by default and should stay private — only the
 * Node app calls it (server-side, via AI_SERVICE_URL). Env knobs: RAG_HOST,
 * RAG_PORT, RAG_WORKERS (prod), PORT (web prod, default 3000).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const profile = process.argv[2] === "start" ? "start" : "dev";
const root = dirname(dirname(fileURLToPath(import.meta.url))); // scripts/ -> repo root
const aiService = join(root, "ai-service");
const isWin = platform() === "win32";

const venvPy = isWin
  ? join(aiService, ".venv", "Scripts", "python.exe")
  : join(aiService, ".venv", "bin", "python");

if (!existsSync(venvPy)) {
  console.error(`[run] Python venv not found at ${venvPy}`);
  console.error(`[run] Create it: cd ai-service && python -m venv .venv && pip install anthropic`);
  process.exit(1);
}

if (profile === "start" && !existsSync(join(root, "build", "server", "index.js"))) {
  console.error(`[run] No production build found (build/server/index.js).`);
  console.error(`[run] Build the web app first:  npm run build`);
  process.exit(1);
}

if (!existsSync(join(aiService, "corpus.jsonl"))) {
  console.warn(`[run] corpus.jsonl missing — build it once:`);
  console.warn(`[run]   cd ai-service && python -m trig_rag.build_corpus --out corpus.jsonl --grammar grammar_sections.jsonl`);
}

const procs = [];
let shuttingDown = false;

function start(name, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
    shell: opts.shell || false,
  });
  const prefix = `[${name}] `;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const l of lines) out.write(prefix + l + "\n");
    });
    stream.on("end", () => {
      if (buf) out.write(prefix + buf + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("error", (e) => process.stderr.write(prefix + `failed to start: ${e.message}\n`));
  child.on("exit", (code) => {
    process.stdout.write(prefix + `exited (code ${code})\n`);
    shutdown();
  });
  procs.push(child);
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of procs) {
    if (c.exitCode === null && c.pid) {
      if (isWin) spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"]);
      else c.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(0), 600);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const host = process.env.RAG_HOST || "127.0.0.1";
const port = process.env.RAG_PORT || "8000";
const uvicornArgs = ["-m", "uvicorn", "trig_rag.service:app", "--host", host, "--port", port];
if (profile === "start") {
  const workers = process.env.RAG_WORKERS || "1";
  if (Number(workers) > 1) uvicornArgs.push("--workers", workers);
}

const webScript = profile === "start" ? "start" : "dev";
const webEnv = profile === "start" ? { NODE_ENV: "production" } : {};

console.log(`[run:${profile}] RAG service on ${host}:${port} + web (npm run ${webScript}) — Ctrl-C stops both`);
start("service", venvPy, uvicornArgs, { cwd: aiService });
start("web", "npm", ["run", webScript], { cwd: root, shell: true, env: webEnv });
