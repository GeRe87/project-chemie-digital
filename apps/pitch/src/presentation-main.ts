import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "katex/dist/katex.min.css";
import "./styles.css";
import "./scientific-title.css";
import "./code-runtime.css";
import "./poll-runtime.css";
import "./presentation-background.css";
import "./chart-theme.css";
import "./diagram-tokens.css";
import "./flow-theme.css";
import "./learning-stage-primitives.css";
import "./visual-stage-primitives.css";
import "./component-composition.css";
import "./card-primitives.css";
import "./evidence-primitives.css";
import "./progression-primitives.css";
import "./course-world.css";
import "./presentation-projection.css";
import "./knowledge-network-runtime.css";
import "./semantic-source-runtime.css";
import "./semantic-multi-view-runtime.css";
import "./analytical-proof-runtime.css";
import "./media-stage-primitives.css";
import "./lecture-readability.css";
import "./presentation-mobile.css";
import "./presentation-clock.css";
import "./presentation-laser-pointer.css";
import "./presentation-step-runtime.css";
import "./teaching-primitives.css";
import "./mathematical-derivation.css";
import "./presenter-tools.css";
import "./presentation-page-motion.css";
import "./script-view.css";
import "./observation-explorer.css";
import "./summary-comparison.css";
import { mountCodeOutputZoom } from "./code-output-zoom.ts";
import { mountPresentationPageMotion, presentationBackgroundProgress } from "./presentation-page-motion.ts";
import { mountScriptView } from "./script-view.ts";
import { prependLectureTitle, resolveLectureTitle } from "./lecture-title.ts";
import { mountMathematicalDerivations } from "./mathematical-derivation-runtime.ts";
import { authoredSvgUris, mountTeachingSvgMedia } from "./teaching-svg-runtime.ts";
import type { CanonicalRuntimeArtifact } from "./graph-scene-data.ts";
import { validateCanonicalRuntimeArtifact } from "../../../packages/core/src/canonical-runtime.ts";
import type { PitchCourseWorldModel } from "./course-world.ts";
import {
  appendPitchCourseLevelBoundarySlides,
} from "./course-world-navigation.ts";
import { mountGraphSummaryShell } from "./graph-summary-shell.ts";
import { isConnectedInteractiveMode, mountExecutableCodeBlocks, type CodeRuntimeController } from "./code-runtime.ts";
import { mountLivePolls, type PollRuntimeController } from "./poll-runtime.ts";
import { mountLocalChoicePolls, type LocalPollRuntimeController } from "./local-poll-runtime.ts";
import { mountPitchDiagrams } from "./flow-runtime.ts";
import { mountPitchCharts } from "./chart-runtime.ts";
import { mountLiveChartUpdates } from "./live-chart-runtime.ts";
import { mountPitchKnowledgeNetworks } from "./knowledge-network-runtime.ts";
import { mountSemanticSourceSteps } from "./semantic-source-runtime.ts";
import { mountSemanticMultiViews } from "./semantic-multi-view-runtime.ts";
import { mountAnalyticalProofSteps } from "./analytical-proof-runtime.ts";
import { mountPresentationProjections } from "./presentation-projection.ts";
import { mountPresentationClock } from "./presentation-clock.ts";
import { mountPresentationLaserPointer } from "./presentation-laser-pointer.ts";
import {
  mountPresentationStageLock,
  mountPresentationStageNavigation,
  mountPresentationNavigationControls,
  mountPresentationSwipeNavigation,
  mountPresentationWheelNavigation,
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
  availableBackgroundFamilies,
  mountAppearanceControls,
  resolveBackgroundPackId,
  resolveDiagramThemeId,
  resolvePresentationAppearance,
  type PresentationProfile,
} from "./presentation-profile.ts";

export async function startPresentation(artifact: CanonicalRuntimeArtifact, courseWorldModel?: PitchCourseWorldModel,
  options?: { readonly profile?: PresentationProfile; readonly collectionTitle?: string }): Promise<void> {
validateCanonicalRuntimeArtifact(artifact);
const canonicalDatasetSnapshot = artifact.datasetSnapshot;
const root = document.querySelector<HTMLElement>("#pitch-slides");
const presentation = document.querySelector<HTMLElement>(".reveal");
if (!root || !presentation) throw new Error("Missing pitch application root");

const shellRoot = document.createElement("div");
shellRoot.id = "view-switch-shell";
presentation.before(shellRoot);

const connectedInteractive = isConnectedInteractiveMode(window.location.search);
const documents = artifact.sceneDocuments;
const localSvgUris = documents.flatMap(document => document.scenes.flatMap(scene => authoredSvgUris(scene.blocks)));
const removeNetworkGuard = connectedInteractive ? () => undefined : installNoNetworkGuard(window, window.location.href, localSvgUris);
let unmountScenes: () => void;
try {
  unmountScenes = mountSceneDocuments({ root, createElement: (tag) => document.createElement(tag) }, documents);
} catch (error) {
  root.textContent = "Szeneninhalte konnten nicht geladen werden.";
  root.setAttribute("role", "alert");
  removeNetworkGuard();
  throw error;
}

if (courseWorldModel) {
  const selected = new Set(documents.map(d => d.id));
  appendPitchCourseLevelBoundarySlides(root, { ...courseWorldModel, units: courseWorldModel.units.filter(u => u.paths.some(p => selected.has(p.sceneDocumentId ?? ""))) });
}

const lectureTitles = documents.map(document => resolveLectureTitle(document,
  artifact.sceneDocumentBindings ?? [], artifact.teachingOfferingDocuments ?? []));
const unmountLectureTitles = documents.map((document, index) => lectureTitles[index]
  ? prependLectureTitle(root, document, lectureTitles[index]!) : () => undefined);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const unmountMathematicalDerivations = mountMathematicalDerivations(root, documents);
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
const unmountLiveCharts = mountLiveChartUpdates(root, documents, { reducedMotion });
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
const appearance = resolvePresentationAppearance(window.location.search, documents[0]?.sourcePathId, options?.profile);
for (const message of appearance.diagnostics) console.warn(message);
preparePresentationStepFragments(root);
const unmountPresentationProjection = appearance.profile.projectionCapabilities?.publication
  ? mountPresentationProjections(root)
  : () => undefined;
const unmountPresentationClock = mountPresentationClock(document.body);
const unmountPresentationLaserPointer = appearance.profile.presenterCapabilities?.laserPointer
  ? mountPresentationLaserPointer(presentation)
  : () => undefined;

// Interactive observation decks require real-sized form controls on portrait
// screens rather than a scaled-down desktop canvas. Capability, not scene ID.
const hasObservationExplorer = documents.some(document => document.scenes.some(scene => scene.blocks.some(block => block.kind === "chart" && block.chartType === "observations")));
const nativePortraitViewport = (appearance.profile.viewportPolicy === "native-portrait" || hasObservationExplorer)
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
document.body.dataset.presentationReadability = appearance.readability;
document.body.dataset.presentationView = appearance.view;

if (appearance.readability === "lecture") {
  for (const section of Array.from(root.querySelectorAll<HTMLElement>('section[data-lecture-budget="over-budget"]'))) {
    const score = section.dataset.lectureBudgetScore ?? "unknown";
    const regions = section.dataset.lecturePrimaryRegions ?? "unknown";
    console.warn(
      `[lecture-budget] Slide '${section.id || "unknown"}' exceeds the lecture content budget `
      + `(score=${score}, primaryRegions=${regions}). Split or simplify the slide instead of shrinking typography.`,
    );
  }
}

const allowedPacks = new Set(availableBackgroundFamilies(appearance.profile).flatMap(family => [family.variants.dark.id, family.variants.light.id]));
const runtimeBackgroundPacks = backgroundPackRegistry.filter(pack => allowedPacks.has(pack.id)).map((pack) => ({
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
  families: availableBackgroundFamilies(appearance.profile),
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

const initialHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
const initialSceneId = /^\d+(?:\/0)?$/.test(initialHash)
  ? documents.flatMap(d => d.scenes)[Number(initialHash.split("/")[0])]?.id
  : initialHash;
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
let viewportKey = `${nativePortraitViewport}:${nativeViewportWidth}:${nativeViewportHeight}`;
const syncNativeViewport = () => {
  if (!hasObservationExplorer && appearance.profile.viewportPolicy !== "native-portrait") return;
  const native = window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
  // Native portrait means the actual presentation area, not the window plus
  // the controls above it. Otherwise Reveal shrinks a phone-width slide again.
  const width = Math.max(240, Math.round(presentation.clientWidth || window.innerWidth));
  const height = Math.max(240, Math.round(presentation.clientHeight || window.innerHeight));
  document.body.classList.toggle("pcd-native-mobile", native);
  const key = `${native}:${width}:${height}`;
  if (key === viewportKey) return;
  viewportKey = key;
  deck.configure({width: native ? width : 1440, height: native ? height : 900, margin: native ? 0 : .04});
  deck.layout();
};
window.addEventListener("resize", syncNativeViewport);
const nativeViewportObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(syncNativeViewport);
nativeViewportObserver?.observe(presentation);
syncNativeViewport();
// Resolve authored deep links to native page boundaries. Reveal's proportional
// scroll-trigger calculation can select a preceding page in fragment-rich decks.
if (initialSceneId) {
  const initialSlide = document.getElementById(initialSceneId);
  initialSlide?.closest<HTMLElement>(".scroll-page")?.scrollIntoView({ block: "start", behavior: "instant" });
}
const returnToWorld = (): void => {
  const url = new URL(window.location.href); url.searchParams.delete("level"); url.hash = "";
  window.location.assign(url);
};
const returnButton = document.createElement("button");
returnButton.type = "button"; returnButton.className = "pcd-return-world"; returnButton.textContent = options?.collectionTitle ?? "Course Overworld";
if (courseWorldModel || options?.collectionTitle) { document.body.append(returnButton); returnButton.addEventListener("click", returnToWorld); }
const onCourseEnd = (): void => { if (deck.getCurrentSlide()?.dataset.courseReturnSentinel === "true") returnToWorld(); };
deck.on("slidechanged", onCourseEnd);
const unmountPresentationSteps = mountPresentationStepRuntime(root, deck);
const unmountPageMotion = mountPresentationPageMotion(root);
const unmountPresentationStageNavigation = mountPresentationStageNavigation(
  deck,
  window,
  presentation,
  { view: appearance.view, root },
);
const unmountPresentationStageLock = mountPresentationStageLock(root, deck, window);
const unmountNavigationControls = appearance.view === "scroll" ? mountPresentationNavigationControls(presentation) : () => undefined;
const unmountSwipes = appearance.view === "scroll" ? mountPresentationSwipeNavigation(deck, presentation, { view: appearance.view, root }) : () => undefined;
const unmountWheel = appearance.view === "scroll" ? mountPresentationWheelNavigation(deck, presentation, { view: appearance.view, root }) : () => undefined;

const presentationVideos = Array.from(
  root.querySelectorAll<HTMLVideoElement>("[data-presentation-video='true']"),
);

function isFullViewportMediaStageScene(scene: HTMLElement | undefined): boolean {
  return scene?.dataset.composition === "media-stage"
    && scene.dataset.compositionProfile === "full-viewport";
}

function syncNavigationMode(): void {
  const current = deck.getCurrentSlide() as HTMLElement | undefined;
  const next = current?.nextElementSibling instanceof HTMLElement ? current.nextElementSibling : undefined;
  const sameConceptSequence =
    current?.dataset.composition === "progression-stage"
    && current?.dataset.compositionProfile === "cards-with-footer"
    && next?.dataset.composition === current.dataset.composition
    && next?.dataset.compositionProfile === current.dataset.compositionProfile;
  const sameFullMediaSequence = isFullViewportMediaStageScene(current) && isFullViewportMediaStageScene(next);
  document.body.classList.toggle(
    "pcd-no-scroll-transition",
    appearance.view === "scroll" && (sameConceptSequence || sameFullMediaSequence),
  );
}

function syncFullMediaMode(): void {
  const current = deck.getCurrentSlide() as HTMLElement | undefined;
  document.body.classList.toggle("pcd-full-media-active", isFullViewportMediaStageScene(current));
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
function syncBackgroundProgress(offset:number, enteredPage=false):void {
  const currentSlide = deck.getCurrentSlide() as HTMLElement | undefined;
  const freezeForLayout =
    (
      currentSlide?.dataset.composition === "progression-stage"
      && currentSlide?.dataset.compositionProfile === "cards-with-footer"
    )
    || isFullViewportMediaStageScene(currentSlide);
  const freezeForActiveStage = document.body.classList.contains("pcd-stage-lock-active");
  if (appearance.view === "scroll" && !enteredPage && (freezeForLayout || freezeForActiveStage)) return;
  const pageIndex=deck.getSlides().indexOf(currentSlide!);
  const horizontal = appearance.profile.backgroundProgressAxis === "horizontal";
  backgroundRuntime.setProgress(horizontal ? (pageIndex + 1) * window.innerWidth : appearance.view === "scroll" ? presentationBackgroundProgress(pageIndex) : offset,{animate:horizontal || appearance.view === "scroll"});
}
// A page-entry event is authoritative even when its new scene already holds a
// stage lock. Fragment-only moves retain the same page/background position.
const syncBackgroundPage=()=>syncBackgroundProgress(revealScrollOffset(),true);
if (appearance.profile.backgroundProgressAxis === "horizontal") window.addEventListener("resize", syncBackgroundPage);
backgroundRuntime.setProgress(appearance.profile.backgroundProgressAxis === "horizontal" ? window.innerWidth : appearance.view === "scroll"
  ? presentationBackgroundProgress(deck.getSlides().indexOf(deck.getCurrentSlide()!))
   : deck.getSlidePastCount(), { animate: appearance.profile.backgroundProgressAxis === "horizontal" });
deck.on("slidechanged",syncBackgroundPage);
const stopBackgroundProgress = progressSource.start((offset) => syncBackgroundProgress(offset));

let codeRuntime: CodeRuntimeController | undefined;
const destroyTeachingMedia = await mountTeachingSvgMedia(root);
let pollRuntime: PollRuntimeController | undefined;
let localPollRuntime: LocalPollRuntimeController | undefined;

try {
  codeRuntime = await mountExecutableCodeBlocks(root);
} catch (error) {
  console.warn("Local interactive code runtime unavailable; static code fallback remains active.", error);
}

try {
  localPollRuntime = mountLocalChoicePolls(root);
} catch (error) {
  console.warn("Local quiz runtime unavailable; authored static choices remain active.", error);
}

if (connectedInteractive) {
  try {
    pollRuntime = mountLivePolls(root, window.location.search);
  } catch (error) {
    console.warn("Connected live poll runtime unavailable; static poll fallback remains active.", error);
  }
}

const unmountCodeOutputZoom=mountCodeOutputZoom(root);
const unmountScriptView=mountScriptView(root,presentation,document.querySelector<HTMLElement>(".pcd-screen-controls")!,documents,deck,lectureTitles[0]);

const refreshInteractiveRuntime = (): void => {
  codeRuntime?.refresh();
  void pollRuntime?.refresh();
};
deck.on("slidechanged", refreshInteractiveRuntime);

const graphShellRoot=document.createElement("div");shellRoot.append(graphShellRoot);
const unmountShell = mountGraphSummaryShell({
  root: graphShellRoot,
  presentation,
  documents,
  snapshot: canonicalDatasetSnapshot,
  currentSceneId: () => deck.getCurrentSlide()?.id ?? null,
});

window.addEventListener("pagehide", () => {
  window.removeEventListener("resize", syncNativeViewport);
  nativeViewportObserver?.disconnect();
  window.removeEventListener("resize", syncBackgroundPage);
  deck.off("slidechanged",syncBackgroundPage);
  unmountScriptView();unmountLectureTitles.forEach(unmount=>unmount());unmountCodeOutputZoom();unmountPageMotion();
  deck.off("slidechanged", refreshInteractiveRuntime);
  pollRuntime?.destroy();
  localPollRuntime?.destroy();
  codeRuntime?.destroy();
  destroyTeachingMedia();
  deck.off("slidechanged", syncPresentationVideos);
  deck.off("slidechanged", syncFullMediaMode);
  deck.off("slidechanged", syncNavigationMode);
  document.body.classList.remove("pcd-no-scroll-transition");
  document.body.classList.remove("pcd-full-media-active");
  document.body.classList.remove("pcd-native-mobile");
  for (const video of presentationVideos) video.pause();
  deck.off("slidechanged", onCourseEnd);
  returnButton.removeEventListener("click", returnToWorld);
  returnButton.remove();
  unmountPresentationStageLock();
  unmountNavigationControls();
  unmountSwipes();
  unmountWheel();
  unmountPresentationStageNavigation();
  unmountPresentationSteps();
  unmountMathematicalDerivations();
  unmountPresentationProjection();
  unmountPresentationLaserPointer();
  unmountPresentationClock();
  unmountSemanticSourceSteps();
  unmountKnowledgeNetworks();
  unmountAnalyticalProofSteps();
  unmountSemanticMultiViews();
  unmountLiveCharts();
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
}
