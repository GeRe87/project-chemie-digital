import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("core package dependencies exclude d3, dom and react adapters", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  const forbidden = ["d3", "react", "react-dom"];
  for (const name of forbidden) {
    assert.equal(Object.keys(deps).some((dependency) => dependency === name || dependency.startsWith(`${name}-`)), false);
  }
});

test("scene graph projector contains no d3, dom or react imports", () => {
  const source = readFileSync(new URL("../src/scene-graph-projector.ts", import.meta.url), "utf8");
  assert.equal(/from\s+["']d3/.test(source), false);
  assert.equal(/from\s+["']react/.test(source), false);
  assert.equal(/\bHTMLElement\b|\bSVGElement\b/.test(source), false);
});
