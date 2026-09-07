import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "katex/dist/katex.min.css";
import "./styles.css";
import "./code-runtime.css";
import "./poll-runtime.css";
import "./presentation-background.css";
import { canonicalDatasetSnapshot, compilePitchSceneDocuments } from "./graph-scene-data.ts";
import { mountGraphSummaryShell } from "./graph-summary-shell.ts";
import { isConnectedInteractiveMode, mountExecutableCodeBlocks, type CodeRuntimeController } from "./code-runtime.ts";
import { mountLivePolls, type PollRuntimeController } from "./poll-runtime.ts";
import { installNoNetworkGuard, mountSceneDocuments } from "./preview.ts";
import { mountBackgroundRuntime } from "../../../packages/renderer-reveal/src/background/background-runtime.ts";
import {
  createDeckProgressSource,
  createScrollProgressSource,
  type BackgroundProgressSource,
} from "../../../packages/renderer-reveal/src/background/background-progress.ts";
import {
  backgroundPackRegistry,
  mountAppearanceControls,
  resolvePresentationAppearance,
} from "./presentation-profile.ts";

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
const appearance = resolvePresentationAppearance(window.location.search);
for (const message of appearance.diagnostics) console.warn(message);

const backgroundRuntime = mountBackgroundRuntime({
  host: document.body,
  packs: backgroundPackRegistry,
  initialPackId: appearance.backgroundPackId,
  reducedMotion,
});
for (const diagnostic of backgroundRuntime.getDiagnostics()) console.warn(`[${diagnostic.code}] ${diagnostic.message}`);

const appearanceControls = mountAppearanceControls({
  root: shellRoot,
  currentPackId: appearance.backgroundPackId,
  onBackgroundChange: (packId) => {
    backgroundRuntime.setPack(packId);
    const url = new URL(window.location.href);
    url.searchParams.set("background", packId ?? "none");
    window.history.replaceState({}, "", url);
  },
});

const deck = new Reveal({
  hash: true,
  keyboard: true,
  controls: true,
  progress: true,
  transition: reducedMotion ? "none" : "slide",
  backgroundTransition: reducedMotion ? "none" : "fade",
  center: false,
  width: 1440,
  height: 900,
  margin: 0.04,
  ...(appearance.view === "scroll"
    ? { view: "scroll", scrollProgress: true, scrollSnap: "mandatory", scrollLayout: "full" }
    : { scrollActivationWidth: 0 }),
});
await deck.initialize();

function revealScrollOffset(): number {
  const viewport = deck.getViewportElement?.() as HTMLElement | undefined;
  const scrollingElement = document.scrollingElement as HTMLElement | null;
  return Math.max(viewport?.scrollTop ?? 0, scrollingElement?.scrollTop ?? 0, window.scrollY ?? 0);
}

function createProgressSource(): BackgroundProgressSource {
  if (appearance.view === "scroll") {
    const viewport = deck.getViewportElement?.() as HTMLElement | undefined;
    return createScrollProgressSource({
      getOffset: revealScrollOffset,
      addScrollListener(listener) {
        const options = { passive: true } as const;
        window.addEventListener("scroll", listener, options);
        viewport?.addEventListener("scroll", listener, options);
        return () => {
          window.removeEventListener("scroll", listener);
          viewport?.removeEventListener("scroll", listener);
        };
      },
      requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
      cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
    });
  }
  return createDeckProgressSource({
    getSlideIndex: () => deck.getSlidePastCount(),
    addSlideChangedListener(listener) {
      deck.on("slidechanged", listener);
      return () => deck.off("slidechanged", listener);
    },
  });
}

const progressSource = createProgressSource();
const stopBackgroundProgress = progressSource.start((offset) => backgroundRuntime.setProgress(offset));

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
  stopBackgroundProgress();
  appearanceControls.destroy();
  backgroundRuntime.destroy();
  void deck.destroy();
  unmountShell();
  shellRoot.remove();
  unmountScenes();
  removeNetworkGuard();
}, { once: true });
