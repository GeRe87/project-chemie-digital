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

interface LayerRuntimeBinding {
  readonly layer: BackgroundLayer;
  readonly strip: HTMLDivElement;
  readonly tile: HTMLImageElement;
  tileHeight: number;
  lastTransform: string;
}

interface StageRuntime {
  readonly element: HTMLDivElement;
  readonly bindings: readonly LayerRuntimeBinding[];
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

function resolveBrowserAssetUrl(asset: string, packId: string, layerId: string): string {
  const base = document.baseURI || globalThis.location?.href;
  if (!base) {
    throw new BackgroundPackError(
      "INVALID_BACKGROUND_PACK",
      `Cannot resolve browser asset URL for background layer ${layerId}`,
      packId,
      layerId,
    );
  }
  const resolved = new URL(asset, base);
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new BackgroundPackError(
      "INVALID_BACKGROUND_PACK",
      `Background layer ${layerId} resolved to unsupported URL scheme ${resolved.protocol}`,
      packId,
      layerId,
    );
  }
  return resolved.href;
}

function objectPosition(anchor: BackgroundLayer["anchor"]): string {
  if (anchor === "left") return "left center";
  if (anchor === "right") return "right center";
  return "center center";
}

export function shouldShowBackgroundWorld(enabled: boolean, activePackId: string | undefined): boolean {
  return enabled && Boolean(activePackId);
}

export function registerBackgroundAssetFailure(
  seenFailures: Set<string>,
  packId: string,
  layerId: string,
  assetUrl: string,
): BackgroundDiagnostic | undefined {
  const key = JSON.stringify([packId, layerId, assetUrl]);
  if (seenFailures.has(key)) return undefined;
  seenFailures.add(key);
  return {
    code: "INVALID_BACKGROUND_LAYER_ASSET",
    message: `Failed to load background layer asset ${assetUrl}`,
    packId,
    layerId,
  };
}

export function collectStaleBackgroundStages<T>(
  mountedStages: Iterable<T>,
  nextStage: T,
  previousStage: T | undefined,
): T[] {
  return [...mountedStages].filter((stage) => stage !== nextStage && stage !== previousStage);
}

function createTile(
  assetUrl: string,
  layer: BackgroundLayer,
  onLoad: () => void,
  onError: () => void,
): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "pcd-background-tile";
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.draggable = false;
  image.decoding = "async";
  image.style.objectPosition = objectPosition(layer.anchor);
  image.addEventListener("load", onLoad, { once: true });
  image.addEventListener("error", () => {
    onError();
    onLoad();
  }, { once: true });
  image.src = assetUrl;
  return image;
}

function createStage(
  pack: BackgroundPack,
  onAssetLoad: () => void,
  onAssetError: (packId: string, layerId: string, assetUrl: string) => void,
): StageRuntime {
  const stage = document.createElement("div");
  stage.className = "pcd-background-stage";
  stage.dataset.backgroundPackId = pack.id;
  stage.setAttribute("aria-hidden", "true");
  stage.style.backgroundColor = pack.baseColor;

  const bindings: LayerRuntimeBinding[] = [];
  for (const [layerIndex, layer] of pack.layers.entries()) {
    const node = document.createElement("div");
    node.className = "pcd-background-layer";
    node.dataset.backgroundLayerId = layer.id;
    node.dataset.backgroundSizing = layer.sizing;
    node.dataset.backgroundAnchor = layer.anchor;
    node.dataset.backgroundRepeat = layer.repeat;
    node.style.zIndex = String(layerIndex + 1);
    const assetUrl = resolveBrowserAssetUrl(layer.asset, pack.id, layer.id);
    node.dataset.backgroundAssetUrl = assetUrl;
    node.style.opacity = String(layer.opacity);
    node.style.mixBlendMode = layer.blendMode ?? "normal";
    if (layer.filter) node.style.filter = layer.filter;

    const strip = document.createElement("div");
    strip.className = "pcd-background-strip";
    const reportError = () => onAssetError(pack.id, layer.id, assetUrl);
    const primaryTile = createTile(assetUrl, layer, onAssetLoad, reportError);
    strip.appendChild(primaryTile);
    if (layer.repeat === "y") {
      strip.appendChild(createTile(assetUrl, layer, onAssetLoad, reportError));
    }
    node.appendChild(strip);
    stage.appendChild(node);
    bindings.push({ layer, strip, tile: primaryTile, tileHeight: 0, lastTransform: "" });
  }

  const vignette = document.createElement("div");
  vignette.className = "pcd-background-vignette";
  stage.appendChild(vignette);
  return { element: stage, bindings };
}

export function tiledLayerTranslation(offset: number, tileHeight: number): number {
  if (!Number.isFinite(offset)) throw new BackgroundPackError("INVALID_BACKGROUND_PACK", "Background offset must be finite");
  if (!Number.isFinite(tileHeight) || tileHeight <= 0) return offset;
  const normalized = ((offset % tileHeight) + tileHeight) % tileHeight;
  return normalized - tileHeight;
}

export function mountBackgroundRuntime(options: BackgroundRuntimeOptions): BackgroundRuntimeHandle {
  const raf = options.requestAnimationFrame ?? globalThis.requestAnimationFrame.bind(globalThis);
  const cancelRaf = options.cancelAnimationFrame ?? globalThis.cancelAnimationFrame.bind(globalThis);
  const scheduleTimeout = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
  const cancelTimeout = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
  const packs = new Map<string, BackgroundPack>();
  const diagnostics: BackgroundDiagnostic[] = [];
  const failedAssets = new Set<string>();

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
  world.hidden = true;
  options.host.prepend(world);

  let destroyed = false;
  let enabled = true;
  let activePackId: string | undefined;
  let progress = 0;
  let currentStage: StageRuntime | undefined;
  let pendingFrame: number | undefined;
  let pendingMeasurementFrame: number | undefined;
  let cleanupTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const mountedStages = new Set<StageRuntime>();

  const updateActiveClass = () => {
    const active = shouldShowBackgroundWorld(enabled, activePackId);
    options.host.classList.toggle("pcd-background-active", active);
    world.hidden = !active;
  };

  const render = () => {
    pendingFrame = undefined;
    if (destroyed || !currentStage || !activePackId || !enabled) return;

    // Scroll hot path: style writes only. DOM queries and layout measurements are
    // intentionally excluded so the browser can keep the moving layers on the compositor.
    for (const binding of currentStage.bindings) {
      const y = layerOffset(binding.layer, progress, options.reducedMotion);
      const translatedY = binding.layer.repeat === "y"
        ? tiledLayerTranslation(y, binding.tileHeight)
        : y;
      const transform = `translate3d(0, ${translatedY.toFixed(3)}px, 0)`;
      if (transform !== binding.lastTransform) {
        binding.strip.style.transform = transform;
        binding.lastTransform = transform;
      }
    }
  };

  const requestRender = () => {
    if (pendingFrame !== undefined || destroyed) return;
    pendingFrame = raf(render);
  };

  const measureCurrentStage = () => {
    pendingMeasurementFrame = undefined;
    if (destroyed || !currentStage) return;
    for (const binding of currentStage.bindings) {
      const height = binding.tile.offsetHeight;
      if (height > 0) binding.tileHeight = height;
    }
    requestRender();
  };

  const requestMeasurement = () => {
    if (pendingMeasurementFrame !== undefined || destroyed) return;
    pendingMeasurementFrame = raf(measureCurrentStage);
  };

  const reportAssetFailure = (packId: string, layerId: string, assetUrl: string) => {
    const diagnostic = registerBackgroundAssetFailure(failedAssets, packId, layerId, assetUrl);
    if (!diagnostic) return;
    diagnostics.push(diagnostic);
    globalThis.console?.warn(`[pcd-background] ${diagnostic.message}`);
  };

  const onResize = () => requestMeasurement();
  window.addEventListener("resize", onResize, { passive: true });

  const removeStage = (stage: StageRuntime | undefined) => {
    if (!stage) return;
    stage.element.remove();
    mountedStages.delete(stage);
  };

  const removeOldStage = (stage: StageRuntime | undefined) => {
    if (!stage || stage === currentStage) return;
    removeStage(stage);
  };

  const setPack = (packId: string | undefined): readonly BackgroundDiagnostic[] => {
    if (destroyed) return [...diagnostics];

    if (!packId) {
      activePackId = undefined;
      currentStage = undefined;
      for (const stage of [...mountedStages]) removeStage(stage);
      if (cleanupTimer !== undefined) {
        cancelTimeout(cleanupTimer);
        cleanupTimer = undefined;
      }
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

    let nextStage: StageRuntime;
    try {
      nextStage = createStage(pack, requestMeasurement, reportAssetFailure);
    } catch (error) {
      diagnostics.push(asDiagnostic(error, pack.id));
      updateActiveClass();
      return [...diagnostics];
    }

    const previous = currentStage;
    const shouldCrossfade = !options.reducedMotion && Boolean(previous);
    nextStage.element.style.opacity = shouldCrossfade ? "0" : "1";
    world.appendChild(nextStage.element);
    mountedStages.add(nextStage);
    currentStage = nextStage;
    activePackId = pack.id;
    world.dataset.backgroundPackId = pack.id;
    world.style.backgroundColor = pack.baseColor;

    if (cleanupTimer !== undefined) {
      cancelTimeout(cleanupTimer);
      cleanupTimer = undefined;
    }
    for (const staleStage of collectStaleBackgroundStages(mountedStages, nextStage, previous)) {
      removeStage(staleStage);
    }

    updateActiveClass();
    requestMeasurement();
    requestRender();

    if (!shouldCrossfade) {
      removeOldStage(previous);
    } else {
      raf(() => {
        if (destroyed || currentStage !== nextStage) return;
        nextStage.element.style.opacity = "1";
        if (previous) previous.element.style.opacity = "0";
      });
      cleanupTimer = scheduleTimeout(() => {
        cleanupTimer = undefined;
        removeOldStage(previous);
      }, 360);
    }
    return [...diagnostics];
  };

  const setEnabled = (next: boolean) => {
    enabled = next;
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
      window.removeEventListener("resize", onResize);
      if (pendingFrame !== undefined) cancelRaf(pendingFrame);
      if (pendingMeasurementFrame !== undefined) cancelRaf(pendingMeasurementFrame);
      if (cleanupTimer !== undefined) cancelTimeout(cleanupTimer);
      mountedStages.clear();
      world.remove();
      options.host.classList.remove("pcd-background-active");
      currentStage = undefined;
    },
  };
}
