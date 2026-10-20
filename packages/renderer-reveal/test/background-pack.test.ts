import assert from "node:assert/strict";
import test from "node:test";
import {
  BackgroundPackError,
  layerOffset,
  validateBackgroundPack,
  type BackgroundPack,
} from "../src/background/background-pack.ts";
import {
  createDeckProgressSource,
  createScrollProgressSource,
} from "../src/background/background-progress.ts";
import {
  collectStaleBackgroundStages,
  registerBackgroundAssetFailure,
  shouldShowBackgroundWorld,
  tiledLayerTranslation,
  interpolateBackgroundProgress,
  BACKGROUND_TRANSITION_DURATION_MS,
} from "../src/background/background-runtime.ts";

const pack: BackgroundPack = {
  version: "1.0",
  id: "test-pack",
  label: "Test Pack",
  baseColor: "#000000",
  layers: [{ id: "near", asset: "/assets/near.webp", speed: 0.5, anchor: "center", repeat: "y", opacity: 0.8, blendMode: "normal", sizing: "cover-width" }],
};

test("BackgroundPack 1.0 validates deterministic local layers", () => {
  assert.doesNotThrow(() => validateBackgroundPack(pack));
  assert.equal(layerOffset(pack.layers[0]!, 400), -200);
  assert.equal(layerOffset(pack.layers[0]!, 400, true), 0);
});

test("tiled layer translation wraps negative parallax offsets without a visible gap", () => {
  assert.equal(tiledLayerTranslation(0, 1000), -1000);
  assert.equal(tiledLayerTranslation(-200, 1000), -200);
  assert.equal(tiledLayerTranslation(-1200, 1000), -200);
  assert.equal(tiledLayerTranslation(250, 1000), -750);
});

test("background progress interpolates forward, backward and from an interrupted position",()=>{
  assert.equal(interpolateBackgroundProgress(10,110,0),10);
  assert.equal(interpolateBackgroundProgress(10,110,1),110);
  const halfway=interpolateBackgroundProgress(10,110,.5);
  assert.ok(halfway>10&&halfway<110);
  const reversed=interpolateBackgroundProgress(halfway,-50,.25);
  assert.ok(reversed<halfway&&reversed>-50);
  assert.equal(interpolateBackgroundProgress(halfway,-50,2),-50);
  assert.equal(interpolateBackgroundProgress(10,110,-1),10);
});

test("background easing starts and stops gently over a longer interval",()=>{
  assert.equal(BACKGROUND_TRANSITION_DURATION_MS,900);
  assert.ok(interpolateBackgroundProgress(0,1,.01)<.0001);
  assert.ok(1-interpolateBackgroundProgress(0,1,.99)<.0001);
  assert.equal(interpolateBackgroundProgress(0,1,.5),.5);
  const samples=Array.from({length:101},(_,i)=>interpolateBackgroundProgress(0,1,i/100));
  assert.ok(samples.every((v,i)=>!i||v>=samples[i-1]!));
});

test("background world is visible only for an enabled active pack", () => {
  assert.equal(shouldShowBackgroundWorld(true, "test-pack"), true);
  assert.equal(shouldShowBackgroundWorld(false, "test-pack"), false);
  assert.equal(shouldShowBackgroundWorld(true, undefined), false);
  assert.equal(shouldShowBackgroundWorld(false, undefined), false);
});

test("asset-load failures are diagnosed at most once per pack/layer/asset", () => {
  const seen = new Set<string>();
  const first = registerBackgroundAssetFailure(seen, "test-pack", "near", "http://localhost/assets/near.webp");
  const duplicate = registerBackgroundAssetFailure(seen, "test-pack", "near", "http://localhost/assets/near.webp");
  const otherLayer = registerBackgroundAssetFailure(seen, "test-pack", "far", "http://localhost/assets/near.webp");

  assert.deepEqual(first, {
    code: "INVALID_BACKGROUND_LAYER_ASSET",
    message: "Failed to load background layer asset http://localhost/assets/near.webp",
    packId: "test-pack",
    layerId: "near",
  });
  assert.equal(duplicate, undefined);
  assert.equal(otherLayer?.layerId, "far");
  assert.equal(seen.size, 2);
});

test("rapid pack switching keeps only the next and immediately fading previous stages", () => {
  const stageA = { id: "a" };
  const stageB = { id: "b" };
  const stageC = { id: "c" };
  assert.deepEqual(
    collectStaleBackgroundStages([stageA, stageB, stageC], stageC, stageB),
    [stageA],
  );
  assert.deepEqual(
    collectStaleBackgroundStages([stageB, stageC], stageC, undefined),
    [stageB],
  );
});

test("BackgroundPack rejects duplicate layer ids", () => {
  const invalid: BackgroundPack = { ...pack, layers: [pack.layers[0]!, { ...pack.layers[0]! }] };
  assert.throws(() => validateBackgroundPack(invalid), (error) => error instanceof BackgroundPackError && error.code === "DUPLICATE_BACKGROUND_LAYER_ID");
});

test("BackgroundPack rejects remote assets and invalid opacity", () => {
  assert.throws(
    () => validateBackgroundPack({ ...pack, layers: [{ ...pack.layers[0]!, asset: "https://example.test/layer.webp" }] }),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_LAYER_ASSET",
  );
  assert.throws(
    () => validateBackgroundPack({ ...pack, layers: [{ ...pack.layers[0]!, asset: "//example.test/layer.webp" }] }),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_LAYER_ASSET",
  );
  assert.throws(
    () => validateBackgroundPack({ ...pack, layers: [{ ...pack.layers[0]!, opacity: 1.2 }] }),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_LAYER_OPACITY",
  );
});

test("deck progress source maps slide index to a stable virtual offset", () => {
  let index = 2;
  let listener: (() => void) | undefined;
  const source = createDeckProgressSource({
    getSlideIndex: () => index,
    addSlideChangedListener(next) { listener = next; return () => { listener = undefined; }; },
  }, 750);
  const values: number[] = [];
  const stop = source.start((value) => values.push(value));
  index = 3;
  listener?.();
  stop();
  assert.deepEqual(values, [1500, 2250]);
  assert.equal(source.current(), 2250);
  assert.equal(listener, undefined);
});

test("scroll progress source coalesces scroll notifications through requestAnimationFrame", () => {
  let offset = 12;
  let scrollListener: (() => void) | undefined;
  let frame: (() => void) | undefined;
  let cancelled = false;
  const source = createScrollProgressSource({
    getOffset: () => offset,
    addScrollListener(next) { scrollListener = next; return () => { scrollListener = undefined; }; },
    requestAnimationFrame(callback) { frame = callback; return 17; },
    cancelAnimationFrame(handle) { assert.equal(handle, 17); cancelled = true; frame = undefined; },
  });
  const values: number[] = [];
  const stop = source.start((value) => values.push(value));
  offset = 42;
  scrollListener?.();
  scrollListener?.();
  frame?.();
  assert.deepEqual(values, [12, 42]);
  offset = 99;
  scrollListener?.();
  stop();
  assert.equal(cancelled, true);
  assert.equal(scrollListener, undefined);
});
