export interface PresentationStepDeck {
  on(
    event: "fragmentshown" | "fragmenthidden" | "slidechanged" | "beforeslidechange",
    listener: () => void,
  ): void;
  off(
    event: "fragmentshown" | "fragmenthidden" | "slidechanged" | "beforeslidechange",
    listener: () => void,
  ): void;
}

export interface PresentationStageLockDeck extends PresentationStepDeck {
  getCurrentSlide(): HTMLElement | null | undefined;
  getViewportElement?(): HTMLElement | null | undefined;
}

export interface PresentationStageNavigationDeck extends PresentationStageLockDeck {
  availableFragments(): { readonly prev: boolean; readonly next: boolean };
  nextFragment(): boolean;
  prevFragment(): boolean;
  getSlides(): HTMLElement[];
  getIndices(slide?: HTMLElement): { readonly h: number; readonly v?: number; readonly f?: number };
  slide(indexh: number, indexv?: number, indexf?: number): void;
}

export interface PresentationStageNavigationTarget {
  addEventListener(
    type: "keydown" | "click",
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: "keydown" | "click",
    listener: EventListener,
    options?: EventListenerOptions | boolean,
  ): void;
}

export interface PresentationStageNavigationOptions {
  readonly view?: "scroll" | "deck";
  readonly root?: HTMLElement;
}

export interface PresentationStageLockWindow {
  readonly scrollX: number;
  readonly scrollY: number;
  scrollTo(x: number, y: number): void;
  addEventListener(
    type: "wheel" | "touchmove",
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: "wheel" | "touchmove",
    listener: EventListener,
    options?: EventListenerOptions | boolean,
  ): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
}

export function clampPresentationStep(step: number, stepCount: number): number {
  if (!Number.isFinite(step) || !Number.isFinite(stepCount)) return 0;
  return Math.max(0, Math.min(Math.max(0, Math.trunc(stepCount)), Math.trunc(step)));
}

export function stepFromVisibleCount(visibleCount: number, stepCount: number): number {
  return clampPresentationStep(visibleCount, stepCount);
}

function numericStepCount(host: Element): number {
  const raw = host.getAttribute("data-presentation-step-count");
  if (!raw) return 0;
  const count = Number(raw);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function hostId(host: Element, fallbackIndex: number): string {
  return host.getAttribute("data-presentation-step-group")
    ?? host.getAttribute("data-chart-block-id")
    ?? host.getAttribute("data-diagram-block-id")
    ?? host.getAttribute("data-flow-block-id")
    ?? host.getAttribute("data-code-block-id")
    ?? host.getAttribute("data-knowledge-scene-id")
    ?? `presentation-step-host-${fallbackIndex}`;
}

export function markStageLockedSlide(slide: Element): void {
  slide.setAttribute("data-has-stages", "true");
  slide.setAttribute("data-stage-lock", "true");
}

export function preparePresentationStepFragments(root: HTMLElement): void {
  const hosts = Array.from(root.querySelectorAll<HTMLElement>("[data-presentation-step-count]"));

  hosts.forEach((host, hostIndex) => {
    const count = numericStepCount(host);
    if (!count) return;

    const id = hostId(host, hostIndex);
    host.setAttribute("data-presentation-step-id", id);

    const slide = host.closest("section");
    if (!slide) return;
    markStageLockedSlide(slide);

    const existing = Array.from(
      slide.querySelectorAll<HTMLElement>(".pcd-presentation-step-fragment"),
    ).filter((fragment) => fragment.dataset.pcdStepFor === id);

    if (existing.length === count) return;
    for (const fragment of existing) fragment.remove();

    for (let step = 1; step <= count; step += 1) {
      const fragment = document.createElement("span");
      fragment.className = "fragment pcd-presentation-step-fragment";
      fragment.dataset.pcdStepFor = id;
      fragment.dataset.pcdStepIndex = String(step);
      fragment.setAttribute("aria-hidden", "true");
      slide.append(fragment);
    }
  });
}

function currentStepForHost(host: HTMLElement): number {
  const count = numericStepCount(host);
  const id = host.getAttribute("data-presentation-step-id");
  const slide = host.closest("section");
  if (!count || !id || !slide) return 0;

  const visibleCount = Array.from(
    slide.querySelectorAll<HTMLElement>(".pcd-presentation-step-fragment.visible"),
  ).filter((fragment) => fragment.dataset.pcdStepFor === id).length;

  return stepFromVisibleCount(visibleCount, count);
}

function resourceIdTokens(element: Element, attribute: string): ReadonlySet<string> {
  return new Set(
    (element.getAttribute(attribute) ?? "")
      .split(/\s+/u)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function applySemanticDisclosure(host: HTMLElement, step: number): void {
  const slide = host.closest("section");
  if (!slide) return;

  const stageResources = resourceIdTokens(host, "data-presentation-step-resource-id");
  if (!stageResources.size) return;

  for (const element of slide.querySelectorAll<HTMLElement>(
    '[data-presentation-disclosure-mode="progressive"][data-presentation-disclosure-step]',
  )) {
    const trigger = element.getAttribute("data-presentation-disclosure-trigger-resource-id");
    if (!trigger || !stageResources.has(trigger)) continue;

    const required = Number(element.getAttribute("data-presentation-disclosure-step"));
    if (!Number.isInteger(required) || required < 1) continue;
    const visible = step >= required;
    element.setAttribute("data-presentation-disclosure-visible", String(visible));
    element.setAttribute("aria-hidden", String(!visible));
  }
}

function dispatchStep(host: HTMLElement, step: number): void {
  host.dispatchEvent(new CustomEvent("pcd-presentation-step", {
    bubbles: false,
    detail: { step },
  }));
  host.dataset.presentationStep = String(step);
  applySemanticDisclosure(host, step);
}

export function mountPresentationStepRuntime(
  root: HTMLElement,
  deck: PresentationStepDeck,
): () => void {
  const update = (): void => {
    for (const host of root.querySelectorAll<HTMLElement>("[data-presentation-step-count]")) {
      dispatchStep(host, currentStepForHost(host));
    }
  };

  deck.on("fragmentshown", update);
  deck.on("fragmenthidden", update);
  deck.on("slidechanged", update);
  update();

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    deck.off("fragmentshown", update);
    deck.off("fragmenthidden", update);
    deck.off("slidechanged", update);
  };
}


type PresentationStageDirection = "next" | "prev";

function stageDirectionForKey(event: KeyboardEvent): PresentationStageDirection | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined;

  const target = event.target as { tagName?: string; isContentEditable?: boolean } | null;
  const tagName = target?.tagName?.toLowerCase();
  if (target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") {
    return undefined;
  }

  if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
    return "next";
  }
  if ((event.key === " " || event.key === "Spacebar") && !event.shiftKey) {
    return "next";
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
    return "prev";
  }
  if ((event.key === " " || event.key === "Spacebar") && event.shiftKey) {
    return "prev";
  }
  return undefined;
}

function stageDirectionForControlClick(event: MouseEvent): PresentationStageDirection | undefined {
  const target = event.target as { closest?: (selector: string) => unknown } | null;
  if (typeof target?.closest !== "function") return undefined;
  if (target.closest(".navigate-right, .navigate-down, .navigate-next")) return "next";
  if (target.closest(".navigate-left, .navigate-up, .navigate-prev")) return "prev";
  return undefined;
}

function scrollToAdjacentPage(
  deck: PresentationStageNavigationDeck,
  target: HTMLElement,
  direction: PresentationStageDirection,
  root?: HTMLElement,
): boolean {
  const viewport = deck.getViewportElement?.();
  const page = target.closest(".scroll-page") as HTMLElement | null;
  if (!viewport || !page) return false;

  root?.dispatchEvent(new CustomEvent("pcd-presentation-stage-exit", { bubbles: false }));

  let top = page.offsetTop;
  if (direction === "prev") {
    const snapPoints = Array.from(page.querySelectorAll<HTMLElement>(".scroll-snap-point"));
    const lastSnap = snapPoints.at(-1);
    if (lastSnap) top += lastSnap.offsetTop;
  }

  viewport.scrollTop = top;
  return true;
}

function navigateToAdjacentSlide(
  deck: PresentationStageNavigationDeck,
  direction: PresentationStageDirection,
  options: PresentationStageNavigationOptions = {},
): boolean {
  const current = deck.getCurrentSlide();
  if (!current) return false;

  const slides = deck.getSlides();
  const currentIndex = slides.indexOf(current);
  if (currentIndex < 0) return false;

  const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  const target = slides[targetIndex];
  if (!target) return false;

  if (options.view === "scroll" && scrollToAdjacentPage(deck, target, direction, options.root)) {
    return true;
  }

  const indices = deck.getIndices(target);
  const fragmentCount = target.querySelectorAll(".fragment").length;
  const targetFragment = direction === "next"
    ? -1
    : fragmentCount > 0
      ? fragmentCount - 1
      : -1;

  deck.slide(indices.h, indices.v ?? 0, targetFragment);
  return true;
}

export function consumePresentationStageNavigation(
  deck: PresentationStageNavigationDeck,
  direction: PresentationStageDirection,
  options: PresentationStageNavigationOptions = {},
): boolean {
  const slide = deck.getCurrentSlide();
  if (!isStageLockedSlide(slide)) return false;

  const available = deck.availableFragments();
  if (direction === "next" && available.next) {
    deck.nextFragment();
    return true;
  }
  if (direction === "prev" && available.prev) {
    deck.prevFragment();
    return true;
  }

  return navigateToAdjacentSlide(deck, direction, options);
}

export function mountPresentationStageNavigation(
  deck: PresentationStageNavigationDeck,
  keyboardTarget: PresentationStageNavigationTarget,
  controlTarget?: PresentationStageNavigationTarget,
  options: PresentationStageNavigationOptions = {},
): () => void {
  const onKeyDown: EventListener = (event) => {
    const keyboardEvent = event as KeyboardEvent;
    const direction = stageDirectionForKey(keyboardEvent);
    if (!direction || !consumePresentationStageNavigation(deck, direction, options)) return;
    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
  };

  const onClick: EventListener = (event) => {
    const mouseEvent = event as MouseEvent;
    const direction = stageDirectionForControlClick(mouseEvent);
    if (!direction || !consumePresentationStageNavigation(deck, direction, options)) return;
    mouseEvent.preventDefault();
    mouseEvent.stopImmediatePropagation();
  };

  keyboardTarget.addEventListener("keydown", onKeyDown, { capture: true });
  controlTarget?.addEventListener("click", onClick, { capture: true });

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    keyboardTarget.removeEventListener("keydown", onKeyDown, { capture: true });
    controlTarget?.removeEventListener("click", onClick, { capture: true });
  };
}

export function isStageLockedSlide(slide: Element | null | undefined): boolean {
  return slide?.getAttribute("data-stage-lock") === "true";
}

export function mountPresentationStageLock(
  root: HTMLElement,
  deck: PresentationStageLockDeck,
  browserWindow: PresentationStageLockWindow,
): () => void {
  const viewport = deck.getViewportElement?.() ?? null;
  const body = root.ownerDocument?.body ?? null;

  let locked = false;
  let targetSlide: HTMLElement | null = null;
  let windowX = browserWindow.scrollX;
  let windowY = browserWindow.scrollY;
  let viewportTop = viewport?.scrollTop ?? 0;
  let restoreFrame: number | undefined;
  let settleFrameOne: number | undefined;
  let settleFrameTwo: number | undefined;

  const setLocked = (active: boolean): void => {
    locked = active;
    body?.classList.toggle("pcd-stage-lock-active", active);
  };

  const cancelRestore = (): void => {
    if (restoreFrame !== undefined) {
      browserWindow.cancelAnimationFrame(restoreFrame);
      restoreFrame = undefined;
    }
  };

  const cancelSettle = (): void => {
    if (settleFrameOne !== undefined) {
      browserWindow.cancelAnimationFrame(settleFrameOne);
      settleFrameOne = undefined;
    }
    if (settleFrameTwo !== undefined) {
      browserWindow.cancelAnimationFrame(settleFrameTwo);
      settleFrameTwo = undefined;
    }
  };

  const unlock = (): void => {
    cancelRestore();
    cancelSettle();
    targetSlide = null;
    setLocked(false);
  };

  const capture = (): void => {
    windowX = browserWindow.scrollX;
    windowY = browserWindow.scrollY;
    viewportTop = viewport?.scrollTop ?? 0;
  };

  const restore = (): void => {
    if (!locked) return;
    browserWindow.scrollTo(windowX, windowY);
    if (viewport) viewport.scrollTop = viewportTop;
  };

  const queueRestore = (): void => {
    if (!locked) return;
    restore();
    cancelRestore();
    restoreFrame = browserWindow.requestAnimationFrame(() => {
      restoreFrame = undefined;
      restore();
    });
  };

  const activateAfterRevealSettles = (): void => {
    unlock();
    const slide = deck.getCurrentSlide() ?? null;
    if (!slide || !isStageLockedSlide(slide)) return;

    targetSlide = slide;
    settleFrameOne = browserWindow.requestAnimationFrame(() => {
      settleFrameOne = undefined;
      settleFrameTwo = browserWindow.requestAnimationFrame(() => {
        settleFrameTwo = undefined;
        if (deck.getCurrentSlide() !== targetSlide || !isStageLockedSlide(targetSlide)) {
          targetSlide = null;
          return;
        }
        capture();
        setLocked(true);
      });
    });
  };

  const blockScroll = (event: Event): void => {
    if (!locked) return;
    event.preventDefault();
    queueRestore();
  };

  const onFragment = (): void => {
    if (!locked) return;
    queueRestore();
  };

  const onSlideChanged = (): void => {
    // Reveal must first finish positioning the newly entered slide. We unlock
    // immediately, then capture the final stable position after two frames.
    activateAfterRevealSettles();
  };

  const onBeforeSlideChange = (): void => {
    // Reveal emits this synchronously before scroll-view scrollToSlide().
    // Releasing here ensures fragment/scroll restoration from the outgoing
    // staged slide cannot cancel the programmatic transition.
    unlock();
  };

  const onStageExit = (): void => {
    unlock();
  };

  root.addEventListener("pcd-presentation-stage-exit", onStageExit);
  deck.on("beforeslidechange", onBeforeSlideChange);
  deck.on("fragmentshown", onFragment);
  deck.on("fragmenthidden", onFragment);
  deck.on("slidechanged", onSlideChanged);
  browserWindow.addEventListener("wheel", blockScroll, { passive: false });
  browserWindow.addEventListener("touchmove", blockScroll, { passive: false });
  viewport?.addEventListener("wheel", blockScroll, { passive: false });
  viewport?.addEventListener("touchmove", blockScroll, { passive: false });
  activateAfterRevealSettles();

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    unlock();
    root.removeEventListener("pcd-presentation-stage-exit", onStageExit);
    deck.off("beforeslidechange", onBeforeSlideChange);
    deck.off("fragmentshown", onFragment);
    deck.off("fragmenthidden", onFragment);
    deck.off("slidechanged", onSlideChanged);
    browserWindow.removeEventListener("wheel", blockScroll);
    browserWindow.removeEventListener("touchmove", blockScroll);
    viewport?.removeEventListener("wheel", blockScroll);
    viewport?.removeEventListener("touchmove", blockScroll);
  };
}
