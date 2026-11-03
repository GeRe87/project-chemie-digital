#!/usr/bin/env node
/** Read-only local preflight. This command never installs or downloads packages. */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const checks = [];
function check(name, task) {
  try { checks.push({ name, ok: true, detail: task() }); }
  catch (error) { checks.push({ name, ok: false, detail: error.message }); }
}
check("Node.js", () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw Error("Node.js 22.12+ is required by the locked Vite toolchain.");
  return process.version;
});
check("npm", () => {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0) throw Error("npm is unavailable on PATH.");
  return result.stdout.trim();
});
check("Locked JavaScript tooling", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  for (const name of ["typescript", "playwright"]) {
    const actual = require(`${name}/package.json`).version;
    if (actual !== manifest.devDependencies[name]) throw Error(`${name}: expected ${manifest.devDependencies[name]}, found ${actual}; run npm ci.`);
  }
  require("rollup"); // Resolves the platform-native optional dependency too.
  require("esbuild").transformSync("const preflight = 1", { loader: "js" });
  return "TypeScript, Playwright, Rollup and the native esbuild binary load successfully.";
});
check("Python semantic toolchain", () => {
  const code = `import json, sys
from build_static_course import check_python_dependencies
if sys.version_info < (3, 11): raise RuntimeError("Python 3.11+ is required")
check_python_dependencies()
print(json.dumps({"version": sys.version.split()[0], "dependencies": "pinned versions match"}))`;
  const result = spawnSync("python", ["-c", code], {
    cwd: path.join(root, "scripts"), encoding: "utf8", timeout: 30000,
  });
  if (result.status !== 0) throw Error((result.stderr || result.error?.message || "python is unavailable").trim() + "\nActivate an environment installed from scripts/requirements-static-build.txt.");
  return JSON.parse(result.stdout);
});
if (process.argv.includes("--browser")) check("Browser executable", () => {
  const engine = process.env.PLAYWRIGHT_BROWSER || "chromium";
  if (!["chromium", "firefox", "webkit"].includes(engine)) throw Error(`Unsupported browser: ${engine}`);
  const playwright = require(process.env.PLAYWRIGHT_MODULE || "playwright");
  const executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH || playwright[engine].executablePath();
  if (process.env.PLAYWRIGHT_CHANNEL && !process.env.PLAYWRIGHT_EXECUTABLE_PATH) return `Configured installed channel: ${process.env.PLAYWRIGHT_CHANNEL}; browser launch will verify it.`;
  if (!existsSync(executable)) throw Error(`Browser executable is missing: ${executable}\nRun npx playwright install ${engine}, or set PLAYWRIGHT_EXECUTABLE_PATH to an installed compatible browser.`);
  return executable;
});
if (process.argv.includes("--json")) console.log(JSON.stringify({ ok: checks.every(item => item.ok), checks }, null, 2));
else for (const item of checks) console.log(`${item.ok ? "OK" : "FAIL"} ${item.name}: ${typeof item.detail === "string" ? item.detail : JSON.stringify(item.detail)}`);
if (checks.some(item => !item.ok)) process.exitCode = 1;
