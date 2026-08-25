import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  interactiveRuntimeVersions,
  isConnectedInteractiveMode,
  wrapRForCapturedOutput,
} from "../src/code-runtime.ts";

test("connected interactive mode is explicit and opt-in", () => {
  assert.equal(isConnectedInteractiveMode(""), false);
  assert.equal(isConnectedInteractiveMode("?interactive=0"), false);
  assert.equal(isConnectedInteractiveMode("?interactive=1"), true);
  assert.equal(isConnectedInteractiveMode("?foo=bar&interactive=1"), true);
});

test("R execution wrapper captures deterministic console-style output", () => {
  const code = "x <- c(6, 8, 10)\nsd(x)";
  const wrapped = wrapRForCapturedOutput(code);
  assert.match(wrapped, /^paste\(capture\.output\(print\(\{/);
  assert.ok(wrapped.includes(code));
  assert.match(wrapped, /collapse="\\n"\)$/);
});

test("interactive browser runtime versions and destinations are pinned", () => {
  assert.deepEqual(interactiveRuntimeVersions, {
    codeMirrorView: "6.43.6",
    webR: "0.6.0",
  });
  const source = readFileSync(new URL("../src/code-runtime.ts", import.meta.url), "utf8");
  assert.match(source, /@codemirror\/view@6\.43\.6/);
  assert.doesNotMatch(source, /codemirror-lang-r|codemirror@6\.0\.2/);
  assert.match(source, /webr\.r-wasm\.org\/v0\.6\.0\/webr\.mjs/);
  assert.match(source, /webr\.r-wasm\.org\/v0\.6\.0\//);
});

test("CodeMirror enhancement avoids cross-package extension graphs", () => {
  const source = readFileSync(new URL("../src/code-runtime.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /basicSetup|R_LANGUAGE_MODULE_URL|rLanguage/);
  assert.match(source, /extensions: \[EditorView\.lineWrapping, EditorView\.editable\.of\(editable\)\]/);
});
