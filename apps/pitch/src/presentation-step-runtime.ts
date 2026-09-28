export interface PresentationStepDeck {
  on(event: "fragmentshown" | "fragmenthidden" | "slidechanged", listener: () => void): void;
  off(event: "fragmentshown" | "fragmenthidden" | "slidechanged", listener: () => void): void;
}

export interface PresentationStageLockDeck extends PresentationStepDeck {
  getCurrentSlide(): HTMLElement | null | undefined;
  getViewportElement?(): HTMLElement | null | undefined;
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

export function preparePresentationStepFragments(root: HTMLElement): void {
  const hosts = Array.from(root.querySelectorAll<HTMLElement>("[data-presentation-step-count]"));

  hosts.forEach((host, hostIndex) => {
    const count = numericStepCount(host);
    if (!count) return;

    const id = hostId(host, hostIndex);
    host.setAttribute("data-presentation-step-id", id);

    const slide = host.closest("section");
    if (!slide) return;
    slide.setAttribute("data-has-stages", "true");
    slide.setAttribute("data-stage-lock", "true");

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

function dispatchStep(host: HTMLElement, step: number): void {
  host.dispatchEvent(new CustomEvent("pcd-presentation-step", {
    bubbles: false,
    detail: { step },
  }));
  host.dataset.presentationStep = String(step);
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
  let windowX = browserWindow.scrollX;
  let windowY = browserWindow.scrollY;
  let viewportTop = viewport?.scrollTop ?? 0;
  let restoreFrame: number | undefined;

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
    restore();
    if (restoreFrame !== undefined) browserWindow.cancelAnimationFrame(restoreFrame);
    restoreFrame = browserWindow.requestAnimationFrame(() => {
      restoreFrame = undefined;
      restore();
    });
  };

  const sync = (): void => {
    locked = isStageLockedSlide(deck.getCurrentSlide());
    body?.classList.toggle("pcd-stage-lock-active", locked);
    if (locked) capture();
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
    sync();
  };

  deck.on("fragmentshown", onFragment);
  deck.on("fragmenthidden", onFragment);
  deck.on("slidechanged", onSlideChanged);
  browserWindow.addEventListener("wheel", blockScroll, { passive: false });
  browserWindow.addEventListener("touchmove", blockScroll, { passive: false });
  viewport?.addEventListener("wheel", blockScroll, { passive: false });
  viewport?.addEventListener("touchmove", blockScroll, { passive: false });
  sync();

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    if (restoreFrame !== undefined) browserWindow.cancelAnimationFrame(restoreFrame);
    deck.off("fragmentshown", onFragment);
    deck.off("fragmenthidden", onFragment);
    deck.off("slidechanged", onSlideChanged);
    browserWindow.removeEventListener("wheel", blockScroll);
    browserWindow.removeEventListener("touchmove", blockScroll);
    viewport?.removeEventListener("wheel", blockScroll);
    viewport?.removeEventListener("touchmove", blockScroll);
    body?.classList.remove("pcd-stage-lock-active");
  };
}
