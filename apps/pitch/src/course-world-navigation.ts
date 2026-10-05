import type { PitchCourseRuntime } from "./graph-scene-data.ts";
import {
  createPitchCourseWorldModel,
  pitchCourseLevelBoundaries,
  renderPitchCourseWorldHtml,
  type PitchCourseWorldModel,
} from "./course-world.ts";

export interface CourseWorldRevealDeck {
  slide(h: number, v?: number, f?: number): void;
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

function authoredSlidesForDocument(root: HTMLElement, documentId: string): HTMLElement[] {
  return directSlides(root).filter((slide) =>
    slide.dataset.sceneDocumentId === documentId
    && slide.dataset.courseLevelBuffer !== "true"
    && slide.dataset.courseReturnSentinel !== "true"
  );
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
  const disposers: Array<() => void> = [];
  let returnFocus: HTMLElement | undefined;
  let destroyed = false;

  const showWorld = (): void => {
    if (destroyed) return;
    presentation.hidden = true;
    presentation.setAttribute("aria-hidden", "true");
    worldShell.hidden = false;
    ownerDocument.body.classList.add("pcd-course-world-active");
    deck.configure({ keyboard: false });
    (returnFocus ?? worldTitle)?.focus();
  };

  const openDocument = (documentId: string, trigger: HTMLElement): void => {
    if (destroyed) return;
    const first = authoredSlidesForDocument(slidesRoot, documentId)[0];
    if (!first) throw new Error(`No authored Pitch slide found for course level document ${documentId}`);
    const index = directSlides(slidesRoot).indexOf(first);
    if (index < 0) throw new Error(`Course level first slide is outside the Reveal root: ${documentId}`);
    returnFocus = trigger;
    worldShell.hidden = true;
    presentation.hidden = false;
    presentation.removeAttribute("aria-hidden");
    ownerDocument.body.classList.remove("pcd-course-world-active");
    deck.configure({ keyboard: true });
    deck.slide(index, 0, 0);
    deck.layout();
    first.tabIndex = -1;
    first.focus({ preventScroll: true });
  };

  for (const button of worldShell.querySelectorAll<HTMLButtonElement>("button[data-scene-document-id]")) {
    const documentId = button.dataset.sceneDocumentId;
    if (!documentId) throw new Error("Course-world Start control is missing its SceneDocument identity");
    const onClick = (): void => openDocument(documentId, button);
    button.addEventListener("click", onClick);
    disposers.push(() => button.removeEventListener("click", onClick));
  }

  const onSlideChanged = (event?: { readonly currentSlide?: HTMLElement }): void => {
    const current = event?.currentSlide ?? deck.getCurrentSlide() ?? undefined;
    if (current?.dataset.courseReturnSentinel === "true") showWorld();
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
