import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "katex/dist/katex.min.css";
import "./styles.css";
import "./code-runtime.css";
import "./poll-runtime.css";
import { canonicalDatasetSnapshot, compilePitchSceneDocuments } from "./graph-scene-data.ts";
import { mountGraphSummaryShell } from "./graph-summary-shell.ts";
import { isConnectedInteractiveMode, mountExecutableCodeBlocks, type CodeRuntimeController } from "./code-runtime.ts";
import { mountLivePolls, type PollRuntimeController } from "./poll-runtime.ts";
import { installNoNetworkGuard, mountSceneDocuments } from "./preview.ts";

const root = document.querySelector<HTMLElement>("#pitch-slides");
const presentation = document.querySelector<HTMLElement>(".reveal");
if (!root || !presentation) throw new Error("Missing pitch application root");
const shellRoot = document.createElement("div");
shellRoot.id = "view-switch-shell";
presentation.before(shellRoot);
const connectedInteractive = isConnectedInteractiveMode(window.location.search);
const removeNetworkGuard = connectedInteractive ? () => undefined : installNoNetworkGuard(window);
const documents = compilePitchSceneDocuments();
let unmountScenes: () => void;
try {
  unmountScenes = mountSceneDocuments({ root, createElement: (tag) => document.createElement(tag) }, documents);
} catch (error) {
  root.textContent = "Szeneninhalte konnten nicht geladen werden.";
  root.setAttribute("role", "alert");
  removeNetworkGuard();
  throw error;
}
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const deck = new Reveal({ hash: true, keyboard: true, controls: true, progress: true, transition: reducedMotion ? "none" : "slide", backgroundTransition: reducedMotion ? "none" : "fade", center: false, width: 1440, height: 900, margin: 0.04 });
await deck.initialize();

let codeRuntime: CodeRuntimeController | undefined;
let pollRuntime: PollRuntimeController | undefined;
if (connectedInteractive) {
  try {
    codeRuntime = await mountExecutableCodeBlocks(root);
  } catch (error) {
    console.warn("Connected interactive code runtime unavailable; static code fallback remains active.", error);
  }
  try {
    pollRuntime = mountLivePolls(root, window.location.search);
  } catch (error) {
    console.warn("Connected live poll runtime unavailable; static poll fallback remains active.", error);
  }
  deck.on("slidechanged", () => {
    codeRuntime?.refresh();
    void pollRuntime?.refresh();
  });
}

const unmountShell = mountGraphSummaryShell({
  root: shellRoot,
  presentation,
  documents,
  snapshot: canonicalDatasetSnapshot,
  currentSceneId: () => deck.getCurrentSlide()?.id ?? null,
});
window.addEventListener("pagehide", () => {
  pollRuntime?.destroy();
  codeRuntime?.destroy();
  void deck.destroy();
  unmountShell();
  shellRoot.remove();
  unmountScenes();
  removeNetworkGuard();
}, { once: true });
