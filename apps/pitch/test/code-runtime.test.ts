import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  interactiveRuntimeDestinations,
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

test("interactive browser runtime versions and destinations are pinned locally", () => {
  assert.deepEqual(interactiveRuntimeVersions, {
    codeMirrorView: "6.43.6",
    webR: "0.6.0",
  });
  assert.deepEqual(interactiveRuntimeDestinations, {
    codeMirrorView: "/vendor/codemirror/view-6.43.6.mjs",
    webRModule: "/vendor/webr/v0.6.0/webr.js",
    webRBase: "/vendor/webr/v0.6.0/",
  });

  const source = readFileSync(new URL("../src/code-runtime.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /cdn\.jsdelivr\.net|webr\.r-wasm\.org/);
  assert.doesNotMatch(source, /https?:\/\//);
  assert.doesNotMatch(source, /webr\.mjs/);
  assert.match(source, /WEBR_MODULE_PATH = "\/vendor\/webr\/v0\.6\.0\/webr\.js"/);
  assert.match(source, /localBrowserUrl\(WEBR_BASE_PATH\)/);
  assert.match(source, /ChannelType\.PostMessage/);
});

test("CodeMirror enhancement keeps one prepared dependency graph and keyboard isolation", () => {
  const source = readFileSync(new URL("../src/code-runtime.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /basicSetup|R_LANGUAGE_MODULE_URL|rLanguage/);
  assert.match(source, /extensions: \[EditorView\.lineWrapping, EditorView\.editable\.of\(editable\)\]/);
  assert.match(source, /event\.stopPropagation\(\)/);
});

test("interactive runtime preparation is explicit and does not run as part of pitch startup", () => {
  const rootPackage = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  assert.equal(rootPackage.scripts["prepare:interactive-runtime"], "python scripts/prepare_interactive_runtime.py");
  assert.equal(rootPackage.scripts["check:interactive-runtime"], "python scripts/prepare_interactive_runtime.py --check");
  assert.doesNotMatch(rootPackage.scripts["pitch:dev"], /prepare:interactive-runtime/);

  const prepSource = readFileSync(new URL("../../../scripts/prepare_interactive_runtime.py", import.meta.url), "utf8");
  assert.match(prepSource, /CODEMIRROR_VERSION = "6\.43\.6"/);
  assert.match(prepSource, /WEBR_VERSION = "0\.6\.0"/);
  assert.match(prepSource, /WEBR_BROWSER_ENTRY = "webr\.js"/);
  assert.match(prepSource, /WEBR_BROWSER_EXPORT = "\.\/dist\/webr\.js"/);
  assert.doesNotMatch(prepSource, /"module": f"\{WEBR_LOCAL_URL\}webr\.mjs"/);
  assert.match(prepSource, /registry\.npmjs\.org\/webr\/\-\/webr-/);
  assert.match(prepSource, /Unexpected webR browser export/);
  assert.match(prepSource, /runtime-manifest\.json/);
  assert.match(prepSource, /--check/);
});
