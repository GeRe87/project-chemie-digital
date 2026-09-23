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
import "./analysis-result-layout.css";
import "./diagram-stage-layout.css";
import "./data-explanation-layout.css";
import "./process-context-layout.css";
import "./card-sequence-layout.css";
import "./text-network-progression-layout.css";
import "./concentric-network-layout.css";
import "./process-diagram-layout.css";
import "./foundation-card-grid-layout.css";
import "./reference-code-layout.css";
import "./hierarchy-flow-layout.css";
import "./concept-specification-layout.css";
import "./presentation-projection.css";
import "./title-attributions-layout.css";
import "./knowledge-network-runtime.css";
import "./semantic-source-runtime.css";
import "./semantic-multi-view-runtime.css";
import "./analytical-proof-runtime.css";
import "./full-media-layout.css";
import "./closing-layout.css";
import "./presentation-mobile.css";
import "./presentation-clock.css";
import "./presentation-laser-pointer.css";
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
import { mountAnalyticalProofSteps } from "./analytical-proof-runtime.ts";
import { mountPresentationProjections } from "./presentation-projection.ts";
import { mountPresentationClock } from "./presentation-clock.ts";
import { mountPresentationLaserPointer } from "./presentation-laser-pointer.ts";
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
const unmountPresentationProjection = mountPresentationProjections(root);

const appearance = resolvePresentationAppearance(window.location.search, documents[0]?.sourcePathId);
for (const message of appearance.diagnostics) console.warn(message);
const unmountPresentationClock = appearance.profile.presenterCapabilities?.clock
  ? mountPresentationClock(document.body)
  : () => undefined;
const unmountPresentationLaserPointer = appearance.profile.presenterCapabilities?.laserPointer
  ? mountPresentationLaserPointer(presentation)
  : () => undefined;

const nativePortraitViewport = appearance.profile.viewportPolicy === "native-portrait"
  && window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
document.body.classList.toggle("pcd-native-mobile", nativePortraitViewport);
const nativeViewportWidth = Math.max(320, Math.round(window.visualViewport?.width ?? window.innerWidth));
const nativeViewportHeight = Math.max(560, Math.round(window.visualViewport?.height ?? window.innerHeight));

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
  width: nativePortraitViewport ? nativeViewportWidth : 1440,
  height: nativePortraitViewport ? nativeViewportHeight : 900,
  margin: nativePortraitViewport ? 0 : 0.04,
  ...(appearance.view === "scroll"
    ? { view: "scroll", scrollProgress: true, scrollSnap: "mandatory", scrollLayout: "full" }
    : { scrollActivationWidth: 0 }),
});
await deck.initialize();
const unmountPresentationSteps = mountPresentationStepRuntime(root, deck);

const presentationVideos = Array.from(
  root.querySelectorAll<HTMLVideoElement>("[data-presentation-video='true']"),
);

function isFullMediaScene(scene: HTMLElement | undefined): boolean {
  return scene?.dataset.layout === "full-media";
}

function syncNavigationMode(): void {
  const current = deck.getCurrentSlide() as HTMLElement | undefined;
  const next = current?.nextElementSibling instanceof HTMLElement ? current.nextElementSibling : undefined;
  const sameConceptSequence = current?.dataset.layout === "concept-specification"
    && next?.dataset.layout === current.dataset.layout;
  const sameFullMediaSequence = isFullMediaScene(current) && isFullMediaScene(next);
  document.body.classList.toggle(
    "pcd-no-scroll-transition",
    appearance.view === "scroll" && (sameConceptSequence || sameFullMediaSequence),
  );
}

function syncFullMediaMode(): void {
  const current = deck.getCurrentSlide() as HTMLElement | undefined;
  document.body.classList.toggle("pcd-full-media-active", isFullMediaScene(current));
}

function syncPresentationVideos(): void {
  const currentSlide = deck.getCurrentSlide();
  for (const video of presentationVideos) {
    const active = currentSlide?.contains(video) ?? false;
    if (!active) {
      video.pause();
      video.currentTime = 0;
      delete video.dataset.pcdPresentationStarted;
      continue;
    }
    if (video.dataset.pcdPresentationStarted === "true") continue;
    video.dataset.pcdPresentationStarted = "true";
    video.currentTime = 0;
    void video.play().catch(() => {
      // Browser autoplay policy may require a direct click; controls stay visible.
    });
  }
}
deck.on("slidechanged", syncPresentationVideos);
deck.on("slidechanged", syncFullMediaMode);
deck.on("slidechanged", syncNavigationMode);
syncNavigationMode();
syncFullMediaMode();
syncPresentationVideos();

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
  const freezeForLayout = currentSlide?.dataset.layout === "concept-specification"
    || currentSlide?.dataset.layout === "full-media";
  if (appearance.view === "scroll" && freezeForLayout) return;
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
  deck.off("slidechanged", syncPresentationVideos);
  deck.off("slidechanged", syncFullMediaMode);
  deck.off("slidechanged", syncNavigationMode);
  document.body.classList.remove("pcd-no-scroll-transition");
  document.body.classList.remove("pcd-full-media-active");
  document.body.classList.remove("pcd-native-mobile");
  for (const video of presentationVideos) video.pause();
  unmountPresentationSteps();
  unmountPresentationProjection();
  unmountPresentationLaserPointer();
  unmountPresentationClock();
  unmountSemanticSourceSteps();
  unmountKnowledgeNetworks();
  unmountAnalyticalProofSteps();
  unmountSemanticMultiViews();
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
