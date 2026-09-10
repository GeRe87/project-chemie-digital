import assert from "node:assert/strict";
import test from "node:test";
import { BackgroundPackError, type BackgroundPack } from "../src/background/background-pack.ts";
import {
  flattenThemedBackgroundPacks,
  resolveThemedBackgroundPack,
  validateThemedBackgroundPackFamily,
  type ThemedBackgroundPackFamily,
} from "../src/background/themed-background.ts";

function pack(id: string): BackgroundPack {
  return {
    version: "1.0",
    id,
    label: id,
    baseColor: "#000000",
    layers: [{
      id: "base",
      asset: `/presentation-backgrounds/${id}.webp`,
      speed: 0,
      anchor: "center",
      repeat: "y",
      opacity: 1,
      sizing: "cover-width",
    }],
  };
}

const family: ThemedBackgroundPackFamily = {
  id: "city",
  label: "City",
  variants: { dark: pack("city-dark"), light: pack("city-light") },
};

test("themed background families require valid paired dark and light variants", () => {
  assert.doesNotThrow(() => validateThemedBackgroundPackFamily(family));
  assert.equal(resolveThemedBackgroundPack(family, "dark").id, "city-dark");
  assert.equal(resolveThemedBackgroundPack(family, "light").id, "city-light");
  assert.deepEqual(flattenThemedBackgroundPacks([family]).map((entry) => entry.id), ["city-dark", "city-light"]);
});

test("themed background family validation fails closed when a variant is missing", () => {
  const invalid = {
    ...family,
    variants: { dark: family.variants.dark },
  } as unknown as ThemedBackgroundPackFamily;
  assert.throws(
    () => validateThemedBackgroundPackFamily(invalid),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_PACK",
  );
});

test("flattening rejects duplicate family and concrete pack ids", () => {
  assert.throws(
    () => flattenThemedBackgroundPacks([family, { ...family }]),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_PACK",
  );
  const second: ThemedBackgroundPackFamily = {
    id: "other",
    label: "Other",
    variants: { dark: pack("city-dark"), light: pack("other-light") },
  };
  assert.throws(
    () => flattenThemedBackgroundPacks([family, second]),
    (error) => error instanceof BackgroundPackError && error.code === "INVALID_BACKGROUND_PACK",
  );
});
