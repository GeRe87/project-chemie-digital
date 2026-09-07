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

function createTile(assetUrl: string, layer: BackgroundLayer, onLoad: () => void): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "pcd-background-tile";
  image.src = assetUrl;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.draggable = false;
  image.decoding = "async";
  image.style.objectPosition = objectPosition(layer.anchor);
  image.addEventListener("load", onLoad, { once: true });
  return image;
}

function createStage(pack: BackgroundPack, onAssetLoad: () => void): HTMLDivElement {
  const stage = document.createElement("div");
  stage.className = "pcd-background-stage";
  stage.dataset.backgroundPackId = pack.id;
  stage.setAttribute("aria-hidden", "true");
  stage.style.backgroundColor = pack.baseColor;

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
    const tileCount = layer.repeat === "y" ? 3 : 1;
    for (let index = 0; index < tileCount; index += 1) {
      strip.appendChild(createTile(assetUrl, layer, onAssetLoad));
    }
    node.appendChild(strip);
    stage.appendChild(node);
  }

  const vignette = document.createElement("div");
  vignette.className = "pcd-background-vignette";
  stage.appendChild(vignette);
  return stage;
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
      const strip = node.querySelector<HTMLElement>(".pcd-background-strip");
      const tile = node.querySelector<HTMLElement>(".pcd-background-tile");
      if (!strip || !tile) continue;
      const y = layerOffset(layer, progress, options.reducedMotion);
      const tileHeight = tile.getBoundingClientRect().height;
      const translatedY = layer.repeat === "y" ? tiledLayerTranslation(y, tileHeight) : y;
      strip.style.transform = `translate3d(0, ${translatedY}px, 0)`;
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

    let nextStage: HTMLDivElement;
    try {
      nextStage = createStage(pack, requestRender);
    } catch (error) {
      diagnostics.push(asDiagnostic(error, pack.id));
      updateActiveClass();
      return [...diagnostics];
    }

    const previous = currentStage;
    const shouldCrossfade = !options.reducedMotion && Boolean(previous);
    nextStage.style.opacity = shouldCrossfade ? "0" : "1";
    world.appendChild(nextStage);
    currentStage = nextStage;
    activePackId = pack.id;
    world.dataset.backgroundPackId = pack.id;
    world.style.backgroundColor = pack.baseColor;
    updateActiveClass();
    requestRender();

    if (!shouldCrossfade) {
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
