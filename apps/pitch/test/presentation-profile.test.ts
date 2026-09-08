import assert from "node:assert/strict";
import test from "node:test";
import {
  backgroundPackRegistry,
  CHEMOMETRICS_SOURCE_PATH_ID,
  COGNIFLOW_SOURCE_PATH_ID,
  chemometricsPresentationProfile,
  cogniflowPresentationProfile,
  resolvePresentationAppearance,
} from "../src/presentation-profile.ts";

test("Chemometrics presentation defaults to Reveal scroll view and neon-city pack", () => {
  const resolved = resolvePresentationAppearance("");
  assert.equal(resolved.profile.id, "chemometrics");
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.backgroundPackId, "chemometrics-neon-city");
  assert.deepEqual(resolved.diagnostics, []);
});

test("Chemometrics source path preserves the existing presentation profile", () => {
  const resolved = resolvePresentationAppearance("", CHEMOMETRICS_SOURCE_PATH_ID);
  assert.equal(resolved.profile, chemometricsPresentationProfile);
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.backgroundPackId, "chemometrics-neon-city");
  assert.deepEqual(resolved.diagnostics, []);
});

test("other existing Chemometrics paths preserve the default profile without warnings", () => {
  const resolved = resolvePresentationAppearance("", "ex:path-chemometrics-random-variables-lecture");
  assert.equal(resolved.profile, chemometricsPresentationProfile);
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.backgroundPackId, "chemometrics-neon-city");
  assert.deepEqual(resolved.diagnostics, []);
});

test("CogniFlow source path selects a neutral scroll profile with no default background", () => {
  const resolved = resolvePresentationAppearance("", COGNIFLOW_SOURCE_PATH_ID);
  assert.equal(resolved.profile, cogniflowPresentationProfile);
  assert.equal(resolved.profile.id, "cogniflow-standardized-data-processing");
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.backgroundPackId, undefined);
  assert.deepEqual(resolved.diagnostics, []);
});

test("query overrides can force deck view and disable the presentation background", () => {
  const resolved = resolvePresentationAppearance("?view=deck&background=none");
  assert.equal(resolved.view, "deck");
  assert.equal(resolved.backgroundPackId, undefined);
  assert.deepEqual(resolved.diagnostics, []);
});

test("unknown appearance overrides fail closed to profile defaults", () => {
  const resolved = resolvePresentationAppearance("?view=wall&background=missing");
  assert.equal(resolved.view, chemometricsPresentationProfile.defaultView);
  assert.equal(resolved.backgroundPackId, chemometricsPresentationProfile.defaultBackgroundPackId);
  assert.equal(resolved.diagnostics.length, 2);
});

test("unregistered source paths preserve the historical default profile silently", () => {
  const resolved = resolvePresentationAppearance("", "ex:path-not-registered");
  assert.equal(resolved.profile, chemometricsPresentationProfile);
  assert.deepEqual(resolved.diagnostics, []);
});

test("Chemometrics pack preserves the supplied five-layer parallax speed model", () => {
  const pack = backgroundPackRegistry.find((candidate) => candidate.id === "chemometrics-neon-city");
  assert.ok(pack);
  assert.deepEqual(pack.layers.map((layer) => [layer.id, layer.speed]), [
    ["bg-skyline", 0.08],
    ["facade-left", 0.22],
    ["facade-right", 0.27],
    ["bridges", 0.44],
    ["rain-fog", 0.72],
  ]);
  assert.ok(pack.layers.every((layer) => !layer.asset.startsWith("http")));
});
