export type BackgroundAnchor = "left" | "center" | "right";
export type BackgroundRepeat = "none" | "y";
export type BackgroundBlendMode = "normal" | "screen";
export type BackgroundSizing = "cover-width" | "cover" | "contain";

export interface BackgroundLayer {
  readonly id: string;
  readonly asset: string;
  readonly speed: number;
  readonly anchor: BackgroundAnchor;
  readonly repeat: BackgroundRepeat;
  readonly opacity: number;
  readonly blendMode?: BackgroundBlendMode;
  readonly sizing: BackgroundSizing;
  readonly filter?: string;
}

export interface BackgroundPack {
  readonly version: "1.0";
  readonly id: string;
  readonly label: string;
  readonly baseColor: string;
  readonly layers: readonly BackgroundLayer[];
}

export type BackgroundDiagnosticCode =
  | "UNSUPPORTED_BACKGROUND_PACK_VERSION"
  | "INVALID_BACKGROUND_PACK"
  | "DUPLICATE_BACKGROUND_LAYER_ID"
  | "INVALID_BACKGROUND_LAYER_ASSET"
  | "INVALID_BACKGROUND_LAYER_SPEED"
  | "INVALID_BACKGROUND_LAYER_OPACITY"
  | "UNSUPPORTED_BACKGROUND_LAYER_ANCHOR"
  | "UNSUPPORTED_BACKGROUND_LAYER_REPEAT"
  | "UNSUPPORTED_BACKGROUND_LAYER_BLEND"
  | "UNSUPPORTED_BACKGROUND_LAYER_SIZING";

export interface BackgroundDiagnostic {
  readonly code: BackgroundDiagnosticCode;
  readonly message: string;
  readonly packId?: string;
  readonly layerId?: string;
}

export class BackgroundPackError extends Error {
  readonly code: BackgroundDiagnosticCode;
  readonly packId?: string;
  readonly layerId?: string;

  constructor(code: BackgroundDiagnosticCode, message: string, packId?: string, layerId?: string) {
    super(message);
    this.code = code;
    this.packId = packId;
    this.layerId = layerId;
  }
}

const ANCHORS = new Set<BackgroundAnchor>(["left", "center", "right"]);
const REPEATS = new Set<BackgroundRepeat>(["none", "y"]);
const BLENDS = new Set<BackgroundBlendMode>(["normal", "screen"]);
const SIZINGS = new Set<BackgroundSizing>(["cover-width", "cover", "contain"]);

function assertLocalAsset(asset: string, packId: string, layerId: string): void {
  const normalized = asset.trim();
  if (!normalized) {
    throw new BackgroundPackError("INVALID_BACKGROUND_LAYER_ASSET", "Background layer asset must be non-empty", packId, layerId);
  }
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalized)) {
    throw new BackgroundPackError(
      "INVALID_BACKGROUND_LAYER_ASSET",
      "Background layer asset must resolve from the local application bundle",
      packId,
      layerId,
    );
  }
}

export function validateBackgroundPack(pack: BackgroundPack): void {
  if ((pack as { version?: unknown }).version !== "1.0") {
    throw new BackgroundPackError(
      "UNSUPPORTED_BACKGROUND_PACK_VERSION",
      `Unsupported background pack version: ${String((pack as { version?: unknown }).version)}`,
      pack.id,
    );
  }
  if (!pack.id.trim() || !pack.label.trim() || !pack.baseColor.trim()) {
    throw new BackgroundPackError("INVALID_BACKGROUND_PACK", "Background pack id, label and baseColor are required", pack.id);
  }
  const ids = new Set<string>();
  for (const layer of pack.layers) {
    if (!layer.id.trim()) {
      throw new BackgroundPackError("INVALID_BACKGROUND_PACK", "Background layer id must be non-empty", pack.id);
    }
    if (ids.has(layer.id)) {
      throw new BackgroundPackError(
        "DUPLICATE_BACKGROUND_LAYER_ID",
        `Duplicate background layer id ${layer.id}`,
        pack.id,
        layer.id,
      );
    }
    ids.add(layer.id);
    assertLocalAsset(layer.asset, pack.id, layer.id);
    if (!Number.isFinite(layer.speed) || layer.speed < 0) {
      throw new BackgroundPackError(
        "INVALID_BACKGROUND_LAYER_SPEED",
        `Invalid speed for background layer ${layer.id}`,
        pack.id,
        layer.id,
      );
    }
    if (!Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) {
      throw new BackgroundPackError(
        "INVALID_BACKGROUND_LAYER_OPACITY",
        `Invalid opacity for background layer ${layer.id}`,
        pack.id,
        layer.id,
      );
    }
    if (!ANCHORS.has(layer.anchor)) {
      throw new BackgroundPackError("UNSUPPORTED_BACKGROUND_LAYER_ANCHOR", `Unsupported anchor ${String(layer.anchor)}`, pack.id, layer.id);
    }
    if (!REPEATS.has(layer.repeat)) {
      throw new BackgroundPackError("UNSUPPORTED_BACKGROUND_LAYER_REPEAT", `Unsupported repeat ${String(layer.repeat)}`, pack.id, layer.id);
    }
    if (layer.blendMode && !BLENDS.has(layer.blendMode)) {
      throw new BackgroundPackError("UNSUPPORTED_BACKGROUND_LAYER_BLEND", `Unsupported blend ${String(layer.blendMode)}`, pack.id, layer.id);
    }
    if (!SIZINGS.has(layer.sizing)) {
      throw new BackgroundPackError("UNSUPPORTED_BACKGROUND_LAYER_SIZING", `Unsupported sizing ${String(layer.sizing)}`, pack.id, layer.id);
    }
  }
}

export function layerOffset(layer: BackgroundLayer, progress: number, reducedMotion = false): number {
  if (!Number.isFinite(progress)) throw new BackgroundPackError("INVALID_BACKGROUND_PACK", "Background progress must be finite");
  return reducedMotion ? 0 : -progress * layer.speed;
}

export function canonicalSerializeBackgroundPack(pack: BackgroundPack): string {
  validateBackgroundPack(pack);
  return JSON.stringify(pack);
}
