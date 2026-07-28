import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "./styles.css";
import { canonicalDatasetSnapshot, compilePitchSceneDocuments } from "./graph-scene-data.ts";
import { mountGraphSummaryShell } from "./graph-summary-shell.ts";
import { installNoNetworkGuard, mountSceneDocuments } from "./preview.ts";

const root = document.querySelector<HTMLElement>("#pitch-slides");
const presentation = document.querySelector<HTMLElement>(".reveal");
const shellRoot = document.querySelector<HTMLElement>("#view-switch-shell");
if (!root || !presentation || !shellRoot) throw new Error("Missing pitch application root");
const removeNetworkGuard = installNoNetworkGuard(window);
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
const unmountShell = mountGraphSummaryShell({
  root: shellRoot,
  presentation,
  documents,
  snapshot: canonicalDatasetSnapshot,
  currentSceneId: () => deck.getCurrentSlide()?.id ?? null,
});
window.addEventListener("pagehide", () => { void deck.destroy(); unmountShell(); unmountScenes(); removeNetworkGuard(); }, { once: true });
