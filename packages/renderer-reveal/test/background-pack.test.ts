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
