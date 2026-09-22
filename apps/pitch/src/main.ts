import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "katex/dist/katex.min.css";
import "./styles.css";
import "./code-runtime.css";
import "./poll-runtime.css";
import "./presentation-background.css";
import "./chart-theme.css";
import "./diagram-tokens.css";
import "./flow-theme.css";
import "./cogniflow-opening-sequence.css";
import "./data-explanation-layout.css";
import "./cogniflow-fair-gap.css";
import "./process-context-layout.css";
import "./cogniflow-semantics-first.css";
import "./cogniflow-semantic-triples.css";
import "./cogniflow-semantic-core.css";
import "./reference-code-layout.css";
import "./hierarchy-flow-layout.css";
import "./concept-specification-layout.css";
import "./cogniflow-presentation-projection.css";
import "./cogniflow-processing-pipeline.css";
import "./cogniflow-service-system.css";
import "./cogniflow-extension-system.css";
import "./cogniflow-title-media.css";
import "./cogniflow-core-sequence.css";
import "./knowledge-network-runtime.css";
import "./semantic-source-runtime.css";
import "./semantic-multi-view-runtime.css";
import "./analytical-proof-runtime.css";
import "./cogniflow-take-home.css";
import "./cogniflow-showcase.css";
import "./cogniflow-closing.css";
import "./cogniflow-mobile.css";
import "./cogniflow-clock-panel.css";
import "./cogniflow-laser-pointer.css";
import "./cogniflow-dark-cards.css";
import "./presentation-step-runtime.css";
import { canonicalDatasetSnapshot, compilePitchSceneDocuments } from "./graph-scene-data.ts";
import { mountGraphSummaryShell } from "./graph-summary-shell.ts";
import { isConnectedInteractiveMode, mountExecutableCodeBlocks, type CodeRuntimeController } from "./code-runtime.ts";
import { mountLivePolls, type PollRuntimeController } from "./poll-runtime.ts";
import { mountPitchDiagrams } from "./flow-runtime.ts";
import { mountPitchCharts } from "./chart-runtime.ts";
import { mountPitchKnowledgeNetworks } from "./knowledge-network-runtime.ts";
import { mountSemanticSourceSteps } from "./semantic-source-runtime.ts";
import { mountSemanticMultiViews } from "./semantic-multi-view-runtime.ts";
import { mountCogniflowSemanticRings } from "./cogniflow-semantic-rings-runtime.ts";
import { mountAnalyticalProofSteps } from "./analytical-proof-runtime.ts";
import { mountCogniflowPresentationProjection } from "./cogniflow-presentation-projection.ts";
import { mountCogniflowClockPanel } from "./cogniflow-clock-panel.ts";
import { mountCogniflowLaserPointer } from "./cogniflow-laser-pointer.ts";
import {
  mountPresentationStepRuntime,
  preparePresentationStepFragments,
} from "./presentation-step-runtime.ts";
import { installNoNetworkGuard, mountSceneDocuments } from "./preview.ts";
import { resolvePublicAssetPath, resolvePublicAssetUrl } from "./public-asset-url.ts";
import { mountBackgroundRuntime } from "../../../packages/renderer-reveal/src/background/background-runtime.ts";
import {
  createDeckProgressSource,
  createScrollProgressSource,
  type BackgroundProgressSource,
} from "../../../packages/renderer-reveal/src/background/background-progress.ts";
import type { PresentationThemeMode } from "../../../packages/renderer-reveal/src/background/themed-background.ts";
import {
  backgroundPackRegistry,
  mountAppearanceControls,
  resolveBackgroundPackId,
  resolveDiagramThemeId,
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
const unmountDiagrams = mountPitchDiagrams(
  Array.from(root.querySelectorAll<HTMLElement>("[data-diagram-block-id]")),
  documents,
  { reducedMotion, interactionPolicy: "keyboard" },
);
const unmountCharts = mountPitchCharts(
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-block-id]")),
  documents,
  { reducedMotion },
);
const unmountSemanticMultiViews = mountSemanticMultiViews(
  root,
  documents,
  canonicalDatasetSnapshot,
);
const unmountSemanticRings = mountCogniflowSemanticRings(root, documents);
const unmountAnalyticalProofSteps = mountAnalyticalProofSteps(
  root,
  documents,
);
const unmountKnowledgeNetworks = mountPitchKnowledgeNetworks(
  Array.from(root.querySelectorAll<HTMLElement>("[data-knowledge-scene-id]")),
  documents,
  canonicalDatasetSnapshot,
  { reducedMotion, interactionPolicy: "keyboard" },
);
const unmountSemanticSourceSteps = mountSemanticSourceSteps(
  root,
  documents,
  canonicalDatasetSnapshot,
);
preparePresentationStepFragments(root);
const unmountPresentationProjection = mountCogniflowPresentationProjection(root);

const appearance = resolvePresentationAppearance(window.location.search, documents[0]?.sourcePathId);
for (const message of appearance.diagnostics) console.warn(message);
const unmountCogniflowClock = appearance.profile.id === "cogniflow-standardized-data-processing"
  ? mountCogniflowClockPanel(document.body)
  : () => undefined;
const unmountCogniflowLaserPointer = appearance.profile.id === "cogniflow-standardized-data-processing"
  ? mountCogniflowLaserPointer(presentation)
  : () => undefined;

const cogniflowPortraitMobile = appearance.profile.id === "cogniflow-standardized-data-processing"
  && window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
document.body.classList.toggle("pcd-cogniflow-mobile", cogniflowPortraitMobile);
const mobileDeckWidth = Math.max(320, Math.round(window.visualViewport?.width ?? window.innerWidth));
const mobileDeckHeight = Math.max(560, Math.round(window.visualViewport?.height ?? window.innerHeight));

let currentTheme: PresentationThemeMode = appearance.theme;
let selectedBackgroundFamilyId = appearance.backgroundFamilyId;
let backgroundEnabled = appearance.backgroundEnabled;

function applyThemeMarker(theme: PresentationThemeMode): void {
  document.body.dataset.presentationTheme = theme;
  document.body.style.colorScheme = theme;
}

function applyDiagramThemeMarker(): void {
  document.body.dataset.diagramTheme = resolveDiagramThemeId(selectedBackgroundFamilyId, backgroundEnabled);
}

applyThemeMarker(currentTheme);
applyDiagramThemeMarker();

const runtimeBackgroundPacks = backgroundPackRegistry.map((pack) => ({
  ...pack,
  layers: pack.layers.map((layer) => ({
    ...layer,
    asset: resolvePublicAssetPath(layer.asset),
  })),
}));

const backgroundRuntime = mountBackgroundRuntime({
  host: document.body,
  packs: runtimeBackgroundPacks,
  initialPackId: appearance.backgroundPackId,
  reducedMotion,
});
for (const diagnostic of backgroundRuntime.getDiagnostics()) console.warn(`[${diagnostic.code}] ${diagnostic.message}`);

function applyBackgroundSelection(): void {
  const concretePackId = backgroundEnabled
    ? resolveBackgroundPackId(selectedBackgroundFamilyId, currentTheme)
    : undefined;
  backgroundRuntime.setPack(concretePackId);
  applyDiagramThemeMarker();
}

const appearanceControls = mountAppearanceControls({
  root: shellRoot,
  currentFamilyId: selectedBackgroundFamilyId,
  backgroundEnabled,
  theme: currentTheme,
  onBackgroundChange: (familyId) => {
    if (familyId) {
      selectedBackgroundFamilyId = familyId;
      backgroundEnabled = true;
    } else {
      backgroundEnabled = false;
    }
    applyBackgroundSelection();
    const url = new URL(window.location.href);
    url.searchParams.set("background", backgroundEnabled && selectedBackgroundFamilyId ? selectedBackgroundFamilyId : "none");
    window.history.replaceState({}, "", url);
  },
  onThemeChange: (theme) => {
    currentTheme = theme;
    applyThemeMarker(theme);
    applyBackgroundSelection();
    const url = new URL(window.location.href);
    url.searchParams.set("theme", theme);
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
  width: cogniflowPortraitMobile ? mobileDeckWidth : 1440,
  height: cogniflowPortraitMobile ? mobileDeckHeight : 900,
  margin: cogniflowPortraitMobile ? 0 : 0.04,
  ...(appearance.view === "scroll"
    ? { view: "scroll", scrollProgress: true, scrollSnap: "mandatory", scrollLayout: "full" }
    : { scrollActivationWidth: 0 }),
});
await deck.initialize();
const unmountPresentationSteps = mountPresentationStepRuntime(root, deck);

const showcaseVideos = Array.from(
  root.querySelectorAll<HTMLVideoElement>("[data-presentation-video='true']"),
);
const showcaseSceneIds = new Set([
  "ex:scene-cogniflow-showcase-still--scene",
  "ex:scene-cogniflow-showcase-video-one--scene",
  "ex:scene-cogniflow-showcase-video-two--scene",
]);

// Some consecutive scenes are deliberate "same camera position" swaps: advancing
// replaces the content without animating the Scroll View. The second scene in each pair
// restores normal scrolling for the following transition.
const hardCutSceneIds = new Set([
  "ex:scene-cogniflow-showcase-still--scene",
  "ex:scene-cogniflow-showcase-video-one--scene",
]);

const frozenBackgroundSceneIds = new Set([
  ...showcaseSceneIds,
]);

function syncNavigationMode(): void {
  const current = deck.getCurrentSlide() as HTMLElement | undefined;
  const sceneId = current?.id ?? "";
  const next = current?.nextElementSibling instanceof HTMLElement ? current.nextElementSibling : undefined;
  const sameStructuralSequence = current?.dataset.layout === "concept-specification"
    && next?.dataset.layout === current.dataset.layout;
  document.body.classList.toggle(
    "pcd-no-scroll-transition",
    appearance.view === "scroll" && (sameStructuralSequence || hardCutSceneIds.has(sceneId)),
  );
}

function syncShowcaseMode(): void {
  const sceneId = deck.getCurrentSlide()?.id ?? "";
  document.body.classList.toggle("pcd-showcase-active", showcaseSceneIds.has(sceneId));
}

function syncShowcaseVideos(): void {
  const currentSlide = deck.getCurrentSlide();
  for (const video of showcaseVideos) {
    const active = currentSlide?.contains(video) ?? false;
    if (!active) {
      video.pause();
      video.currentTime = 0;
      delete video.dataset.pcdShowcaseStarted;
      continue;
    }
    if (video.dataset.pcdShowcaseStarted === "true") continue;
    video.dataset.pcdShowcaseStarted = "true";
    video.currentTime = 0;
    void video.play().catch(() => {
      // Browser autoplay policy may require a direct click; controls stay visible.
    });
  }
}
deck.on("slidechanged", syncShowcaseVideos);
deck.on("slidechanged", syncShowcaseMode);
deck.on("slidechanged", syncNavigationMode);
syncNavigationMode();
syncShowcaseMode();
syncShowcaseVideos();

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
          window.removeEventListener("scroll", listener, options);
          viewport?.removeEventListener("scroll", listener, options);
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
const stopBackgroundProgress = progressSource.start((offset) => {
  const currentSlide = deck.getCurrentSlide() as HTMLElement | undefined;
  const currentSceneId = currentSlide?.id ?? "";
  const freezeForLayout = currentSlide?.dataset.layout === "concept-specification";
  if (appearance.view === "scroll" && (freezeForLayout || frozenBackgroundSceneIds.has(currentSceneId))) return;
  backgroundRuntime.setProgress(offset);
});

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
  deck.off("slidechanged", syncShowcaseVideos);
  deck.off("slidechanged", syncShowcaseMode);
  deck.off("slidechanged", syncNavigationMode);
  document.body.classList.remove("pcd-no-scroll-transition");
  document.body.classList.remove("pcd-showcase-active");
  document.body.classList.remove("pcd-cogniflow-mobile");
  for (const video of showcaseVideos) video.pause();
  unmountPresentationSteps();
  unmountPresentationProjection();
  unmountCogniflowLaserPointer();
  unmountCogniflowClock();
  unmountSemanticSourceSteps();
  unmountKnowledgeNetworks();
  unmountAnalyticalProofSteps();
  unmountSemanticMultiViews();
  unmountSemanticRings();
  unmountCharts();
  unmountDiagrams();
  stopBackgroundProgress();
  appearanceControls.destroy();
  backgroundRuntime.destroy();
  void deck.destroy();
  unmountShell();
  shellRoot.remove();
  unmountScenes();
  removeNetworkGuard();
}, { once: true });
