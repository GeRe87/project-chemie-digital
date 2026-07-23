import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "./styles.css";
import { compilePitchSceneDocuments } from "./graph-scene-data.ts";
import { installNoNetworkGuard, mountSceneDocuments } from "./preview.ts";

const root = document.querySelector<HTMLElement>("#pitch-slides");
if (!root) throw new Error("Missing pitch slide root");
const removeNetworkGuard = installNoNetworkGuard(window);
let unmount: () => void;
try {
  unmount = mountSceneDocuments({ root, createElement: (tag) => document.createElement(tag) }, compilePitchSceneDocuments());
} catch (error) {
  root.textContent = "Szeneninhalte konnten nicht geladen werden.";
  root.setAttribute("role", "alert");
  removeNetworkGuard();
  throw error;
}
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const deck = new Reveal({ hash: true, keyboard: true, controls: true, progress: true, transition: reducedMotion ? "none" : "slide", backgroundTransition: reducedMotion ? "none" : "fade", center: false, width: 1440, height: 900, margin: 0.04 });
await deck.initialize();
window.addEventListener("pagehide", () => { void deck.destroy(); unmount(); removeNetworkGuard(); }, { once: true });
