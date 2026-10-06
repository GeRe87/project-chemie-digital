import type { PitchCourseRuntime } from "./graph-scene-data.ts";
import {
  createPitchCourseWorldModel,
  pitchCourseLevelBoundaries,
  renderPitchCourseWorldHtml,
  type PitchCourseWorldModel,
} from "./course-world.ts";

export interface CourseWorldRevealDeck {
  slide(h: number, v?: number, f?: number): void;
  getSlides(): readonly HTMLElement[];
  getIndices(slide?: HTMLElement): { readonly h: number; readonly v?: number; readonly f?: number };
  layout(): void;
  configure(options: { readonly keyboard?: boolean }): void;
  on(eventName: "slidechanged", listener: (event?: { readonly currentSlide?: HTMLElement }) => void): void;
  off(eventName: "slidechanged", listener: (event?: { readonly currentSlide?: HTMLElement }) => void): void;
  getCurrentSlide(): HTMLElement | null;
}

export function createPitchCourseWorldFromRuntime(runtime: PitchCourseRuntime): PitchCourseWorldModel {
  return createPitchCourseWorldModel(runtime.offering, runtime.sceneDocuments, runtime.bindings, "en");
}

function directSlides(root: HTMLElement): HTMLElement[] {
  return Array.from(root.children).filter((candidate): candidate is HTMLElement => candidate instanceof HTMLElement);
}

export function isAuthoredCourseSlide(slide: HTMLElement, documentId: string): boolean {
  return slide.dataset.sceneDocumentId === documentId
    && slide.dataset.courseLevelBuffer !== "true"
    && slide.dataset.courseReturnSentinel !== "true";
}

function authoredSlidesForDocument(root: HTMLElement, documentId: string): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-scene-document-id]"),
  ).filter((slide) => isAuthoredCourseSlide(slide, documentId));
}

function authoredRevealSlidesForDocument(
  deck: Pick<CourseWorldRevealDeck, "getSlides">,
  documentId: string,
): HTMLElement[] {
  return [...deck.getSlides()].filter((slide) => isAuthoredCourseSlide(slide, documentId));
}

export function shouldReturnToCourseWorld(
  slide: HTMLElement | undefined,
  activeDocumentId: string | undefined,
): boolean {
  return activeDocumentId !== undefined
    && slide?.dataset.courseReturnSentinel === "true"
    && slide.dataset.sceneDocumentId === activeDocumentId;
}

export function resolveCourseSlideTarget(
  deck: Pick<CourseWorldRevealDeck, "getIndices">,
  slide: HTMLElement,
): { readonly h: number; readonly v: number; readonly f: number } {
  const indices = deck.getIndices(slide);
  if (!Number.isInteger(indices.h) || indices.h < 0) {
    throw new Error("Reveal did not resolve a valid horizontal index for the requested course slide");
  }
  const v = indices.v ?? 0;
  const f = indices.f ?? 0;
  if (!Number.isInteger(v) || v < 0 || !Number.isInteger(f) || f < 0) {
    throw new Error("Reveal returned invalid vertical or fragment indices for the requested course slide");
  }
  return { h: indices.h, v, f };
}

export function appendPitchCourseLevelBoundarySlides(
  root: HTMLElement,
  model: PitchCourseWorldModel,
): void {
  const ownerDocument = root.ownerDocument;
  for (const boundary of pitchCourseLevelBoundaries(model)) {
    const authored = authoredSlidesForDocument(root, boundary.sceneDocumentId);
    const last = authored.at(-1);
    if (!last) throw new Error(`No authored Pitch slides found for course level document ${boundary.sceneDocumentId}`);

    const buffer = ownerDocument.createElement("section");
    buffer.dataset.courseLevelBuffer = "true";
    buffer.dataset.sceneDocumentId = boundary.sceneDocumentId;
    buffer.dataset.layout = "course-level-buffer";
    buffer.id = `course-level-buffer-${encodeURIComponent(boundary.sceneDocumentId)}`;
    const kicker = ownerDocument.createElement("p");
    kicker.className = "pcd-level-buffer-kicker";
    kicker.textContent = `LEVEL ${boundary.levelNumber} COMPLETE`;
    const heading = ownerDocument.createElement("h2");
    heading.textContent = boundary.label;
    const next = ownerDocument.createElement("p");
    next.className = "pcd-level-buffer-next";
    next.textContent = "Next → Course Overworld";
    buffer.append(kicker, heading, next);

    const sentinel = ownerDocument.createElement("section");
    sentinel.dataset.courseReturnSentinel = "true";
    sentinel.dataset.sceneDocumentId = boundary.sceneDocumentId;
    sentinel.dataset.transition = "none";
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.id = `course-return-${encodeURIComponent(boundary.sceneDocumentId)}`;

    last.after(buffer, sentinel);
  }
}

export interface PitchCourseWorldNavigation {
  readonly model: PitchCourseWorldModel;
  showWorld(): void;
  destroy(): void;
}

export function mountPitchCourseWorldNavigation(options: {
  readonly model: PitchCourseWorldModel;
  readonly presentation: HTMLElement;
  readonly slidesRoot: HTMLElement;
  readonly deck: CourseWorldRevealDeck;
}): PitchCourseWorldNavigation {
  const { model, presentation, slidesRoot, deck } = options;
  const ownerDocument = presentation.ownerDocument;
  const worldShell = ownerDocument.createElement("section");
  worldShell.className = "pitch-course-world-shell";
  worldShell.innerHTML = renderPitchCourseWorldHtml(model);
  presentation.before(worldShell);

  const worldTitle = worldShell.querySelector<HTMLElement>("#pitch-course-world-title");
  const navigationStatus = worldShell.querySelector<HTMLElement>("[data-course-navigation-status]");
  const disposers: Array<() => void> = [];
  let returnFocus: HTMLElement | undefined;
  let activeDocumentId: string | undefined;
  let destroyed = false;

  const clearNavigationStatus = (): void => {
    worldShell.dataset.navigationState = "idle";
    if (!navigationStatus) return;
    navigationStatus.hidden = true;
    navigationStatus.textContent = "";
  };

  const reportNavigationError = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    worldShell.dataset.navigationState = "error";
    if (navigationStatus) {
      navigationStatus.hidden = false;
      navigationStatus.textContent = `Could not open level: ${message}`;
    }
    console.error(error);
  };

  const showWorld = (): void => {
    if (destroyed) return;
    activeDocumentId = undefined;
    presentation.hidden = true;
    presentation.setAttribute("aria-hidden", "true");
    worldShell.hidden = false;
    worldShell.removeAttribute("aria-hidden");
    ownerDocument.body.classList.add("pcd-course-world-active");
    deck.configure({ keyboard: false });
    (returnFocus ?? worldTitle)?.focus();
  };

  const openDocument = (documentId: string, trigger: HTMLElement): void => {
    if (destroyed) return;
    const first = authoredRevealSlidesForDocument(deck, documentId)[0];
    if (!first) {
      const mounted = Array.from(
        slidesRoot.querySelectorAll<HTMLElement>("[data-scene-document-id]"),
      ).map((slide) => slide.dataset.sceneDocumentId).filter(Boolean);
      throw new Error(
        `No authored Reveal slide found for course level document ${documentId}; mounted document ids: ${[...new Set(mounted)].join(", ") || "none"}`,
      );
    }
    const target = resolveCourseSlideTarget(deck, first);

    returnFocus = trigger;
    activeDocumentId = documentId;
    clearNavigationStatus();

    // Keep the Reveal deck visually hidden behind the overworld while jumping.
    // Cross-level jumps can emit intermediate slidechanged events from the
    // previously active document; sentinel handling is therefore scoped to
    // activeDocumentId below.
    presentation.hidden = false;
    presentation.removeAttribute("aria-hidden");
    deck.configure({ keyboard: true });
    deck.slide(target.h, target.v, target.f);
    deck.layout();

    const selected = deck.getCurrentSlide();
    if (selected !== first) {
      throw new Error(
        `Reveal did not select the requested first slide for course level document ${documentId}`,
      );
    }

    worldShell.hidden = true;
    worldShell.setAttribute("aria-hidden", "true");
    ownerDocument.body.classList.remove("pcd-course-world-active");
    first.tabIndex = -1;
    first.focus({ preventScroll: true });
  };

  const onWorldClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("button[data-scene-document-id]");
    if (!button || !worldShell.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    const documentId = button.dataset.sceneDocumentId;
    if (!documentId) {
      reportNavigationError(new Error("Course-world Start control is missing its SceneDocument identity"));
      return;
    }
    try {
      openDocument(documentId, button);
    } catch (error) {
      showWorld();
      reportNavigationError(error);
    }
  };
  worldShell.addEventListener("click", onWorldClick);
  disposers.push(() => worldShell.removeEventListener("click", onWorldClick));

  const onSlideChanged = (event?: { readonly currentSlide?: HTMLElement }): void => {
    const current = event?.currentSlide ?? deck.getCurrentSlide() ?? undefined;
    if (shouldReturnToCourseWorld(current, activeDocumentId)) showWorld();
  };
  deck.on("slidechanged", onSlideChanged);
  disposers.push(() => deck.off("slidechanged", onSlideChanged));

  showWorld();

  return {
    model,
    showWorld,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const dispose of disposers.splice(0)) dispose();
      ownerDocument.body.classList.remove("pcd-course-world-active");
      presentation.hidden = false;
      presentation.removeAttribute("aria-hidden");
      worldShell.remove();
    },
  };
}
