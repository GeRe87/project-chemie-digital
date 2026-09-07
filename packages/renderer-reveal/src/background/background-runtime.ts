import {
  BackgroundPackError,
  layerOffset,
  validateBackgroundPack,
  type BackgroundDiagnostic,
  type BackgroundLayer,
  type BackgroundPack,
} from "./background-pack.ts";

export interface BackgroundRuntimeOptions {
  readonly host: HTMLElement;
  readonly packs: readonly BackgroundPack[];
  readonly initialPackId?: string;
  readonly reducedMotion: boolean;
  readonly requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  readonly cancelAnimationFrame?: (handle: number) => void;
  readonly setTimeout?: (callback: () => void, delayMs: number) => ReturnType<typeof globalThis.setTimeout>;
  readonly clearTimeout?: (handle: ReturnType<typeof globalThis.setTimeout>) => void;
}

export interface BackgroundRuntimeState {
  readonly enabled: boolean;
  readonly activePackId?: string;
  readonly progress: number;
  readonly reducedMotion: boolean;
}

export interface BackgroundRuntimeHandle {
  setPack(packId: string | undefined): readonly BackgroundDiagnostic[];
  setEnabled(enabled: boolean): void;
  setProgress(offset: number): void;
  getState(): BackgroundRuntimeState;
  getDiagnostics(): readonly BackgroundDiagnostic[];
  destroy(): void;
}

function asDiagnostic(error: unknown, packId?: string): BackgroundDiagnostic {
  if (error instanceof BackgroundPackError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.packId ? { packId: error.packId } : packId ? { packId } : {}),
      ...(error.layerId ? { layerId: error.layerId } : {}),
    };
  }
  return {
    code: "INVALID_BACKGROUND_PACK",
    message: error instanceof Error ? error.message : "Unknown presentation background failure",
    ...(packId ? { packId } : {}),
  };
}

function backgroundSize(layer: BackgroundLayer): string {
  if (layer.sizing === "cover-width") return "100% auto";
  return layer.sizing;
}

function createStage(pack: BackgroundPack): HTMLDivElement {
  const stage = document.createElement("div");
  stage.className = "pcd-background-stage";
  stage.dataset.backgroundPackId = pack.id;
  stage.setAttribute("aria-hidden", "true");
  stage.style.backgroundColor = pack.baseColor;

  for (const layer of pack.layers) {
    const node = document.createElement("div");
    node.className = "pcd-background-layer";
    node.dataset.backgroundLayerId = layer.id;
    node.style.backgroundImage = `url("${layer.asset.replaceAll('"', "%22")}")`;
    node.style.backgroundRepeat = layer.repeat === "y" ? "repeat-y" : "no-repeat";
    node.style.backgroundPositionX = layer.anchor;
    node.style.backgroundSize = backgroundSize(layer);
    node.style.opacity = String(layer.opacity);
    node.style.mixBlendMode = layer.blendMode ?? "normal";
    if (layer.filter) node.style.filter = layer.filter;
    stage.appendChild(node);
  }

  const vignette = document.createElement("div");
  vignette.className = "pcd-background-vignette";
  stage.appendChild(vignette);
  return stage;
}

export function mountBackgroundRuntime(options: BackgroundRuntimeOptions): BackgroundRuntimeHandle {
  const raf = options.requestAnimationFrame ?? globalThis.requestAnimationFrame.bind(globalThis);
  const cancelRaf = options.cancelAnimationFrame ?? globalThis.cancelAnimationFrame.bind(globalThis);
  const scheduleTimeout = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
  const cancelTimeout = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
  const packs = new Map<string, BackgroundPack>();
  const diagnostics: BackgroundDiagnostic[] = [];

  for (const pack of options.packs) {
    try {
      validateBackgroundPack(pack);
      if (packs.has(pack.id)) {
        throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Duplicate background pack id ${pack.id}`, pack.id);
      }
      packs.set(pack.id, pack);
    } catch (error) {
      diagnostics.push(asDiagnostic(error, pack.id));
    }
  }

  const world = document.createElement("div");
  world.className = "pcd-background-world";
  world.setAttribute("aria-hidden", "true");
  options.host.prepend(world);

  let destroyed = false;
  let enabled = true;
  let activePackId: string | undefined;
  let progress = 0;
  let currentStage: HTMLDivElement | undefined;
  let pendingFrame: number | undefined;
  let cleanupTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  const updateActiveClass = () => {
    options.host.classList.toggle("pcd-background-active", enabled && Boolean(activePackId));
  };

  const render = () => {
    pendingFrame = undefined;
    if (destroyed || !currentStage || !activePackId || !enabled) return;
    const pack = packs.get(activePackId);
    if (!pack) return;

    const nodes = [...currentStage.querySelectorAll<HTMLElement>("[data-background-layer-id]")];
    for (const layer of pack.layers) {
      const node = nodes.find((candidate) => candidate.dataset.backgroundLayerId === layer.id);
      if (!node) continue;
      const y = layerOffset(layer, progress, options.reducedMotion);
      node.style.backgroundPositionY = `${y}px`;
    }
  };

  const requestRender = () => {
    if (pendingFrame !== undefined || destroyed) return;
    pendingFrame = raf(render);
  };

  const removeOldStage = (stage: HTMLDivElement | undefined) => {
    if (!stage || stage === currentStage) return;
    stage.remove();
  };

  const setPack = (packId: string | undefined): readonly BackgroundDiagnostic[] => {
    if (destroyed) return [...diagnostics];

    if (!packId) {
      activePackId = undefined;
      currentStage?.remove();
      currentStage = undefined;
      world.dataset.backgroundPackId = "none";
      world.style.backgroundColor = "";
      updateActiveClass();
      return [...diagnostics];
    }

    const pack = packs.get(packId);
    if (!pack) {
      diagnostics.push({
        code: "INVALID_BACKGROUND_PACK",
        message: `Unknown background pack ${packId}`,
        packId,
      });
      return [...diagnostics];
    }

    const nextStage = createStage(pack);
    nextStage.style.opacity = options.reducedMotion ? "1" : "0";
    const previous = currentStage;
    world.appendChild(nextStage);
    currentStage = nextStage;
    activePackId = pack.id;
    world.dataset.backgroundPackId = pack.id;
    world.style.backgroundColor = pack.baseColor;
    updateActiveClass();
    requestRender();

    if (options.reducedMotion) {
      removeOldStage(previous);
    } else {
      raf(() => {
        if (destroyed || currentStage !== nextStage) return;
        nextStage.style.opacity = "1";
        if (previous) previous.style.opacity = "0";
      });
      if (cleanupTimer !== undefined) cancelTimeout(cleanupTimer);
      cleanupTimer = scheduleTimeout(() => {
        cleanupTimer = undefined;
        removeOldStage(previous);
      }, 360);
    }
    return [...diagnostics];
  };

  const setEnabled = (next: boolean) => {
    enabled = next;
    world.hidden = !enabled;
    updateActiveClass();
    if (enabled) requestRender();
  };

  if (options.initialPackId) setPack(options.initialPackId);
  else updateActiveClass();

  return {
    setPack,
    setEnabled,
    setProgress(offset) {
      if (!Number.isFinite(offset)) {
        diagnostics.push({
          code: "INVALID_BACKGROUND_PACK",
          message: "Background progress must be finite",
          ...(activePackId ? { packId: activePackId } : {}),
        });
        return;
      }
      progress = offset;
      requestRender();
    },
    getState: () => ({
      enabled,
      ...(activePackId ? { activePackId } : {}),
      progress,
      reducedMotion: options.reducedMotion,
    }),
    getDiagnostics: () => [...diagnostics],
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (pendingFrame !== undefined) cancelRaf(pendingFrame);
      if (cleanupTimer !== undefined) cancelTimeout(cleanupTimer);
      world.remove();
      options.host.classList.remove("pcd-background-active");
      currentStage = undefined;
    },
  };
}
