import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  backgroundFamilyRegistry,
  backgroundPackRegistry,
  CHEMOMETRICS_SOURCE_PATH_ID,
  COGNIFLOW_SOURCE_PATH_ID,
  chemometricsCityFamily,
  chemometricsPresentationProfile,
  cogniflowPresentationProfile,
  resolveBackgroundPackId,
  resolveDiagramThemeId,
  resolvePresentationAppearance,
} from "../src/presentation-profile.ts";
import { validateThemedBackgroundPackFamily } from "../../../packages/renderer-reveal/src/background/themed-background.ts";

const LIGHT_ASSET_ROOT = "/presentation-backgrounds/chemometrics-city/light/";

test("Chemometrics defaults to dark scroll view with the paired city family", () => {
  const resolved = resolvePresentationAppearance("");
  assert.equal(resolved.profile.id, "chemometrics");
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.theme, "dark");
  assert.equal(resolved.backgroundEnabled, true);
  assert.equal(resolved.backgroundFamilyId, "chemometrics-city");
  assert.equal(resolved.backgroundPackId, "chemometrics-city-dark");
  assert.equal(resolved.diagramThemeId, "eco-city");
  assert.deepEqual(resolved.diagnostics, []);
});

test("Chemometrics source path preserves the existing presentation profile", () => {
  const resolved = resolvePresentationAppearance("", CHEMOMETRICS_SOURCE_PATH_ID);
  assert.equal(resolved.profile, chemometricsPresentationProfile);
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.theme, chemometricsPresentationProfile.defaultTheme);
  assert.equal(resolved.backgroundFamilyId, chemometricsPresentationProfile.defaultBackgroundFamilyId);
  assert.deepEqual(resolved.diagnostics, []);
});

test("other existing Chemometrics paths preserve the default profile without warnings", () => {
  const resolved = resolvePresentationAppearance("", "ex:path-chemometrics-random-variables-lecture");
  assert.equal(resolved.profile, chemometricsPresentationProfile);
  assert.equal(resolved.backgroundPackId, "chemometrics-city-dark");
  assert.deepEqual(resolved.diagnostics, []);
});

test("CogniFlow defaults to Eco City light and keeps the paired dark variant available", () => {
  const resolved = resolvePresentationAppearance("", COGNIFLOW_SOURCE_PATH_ID);
  assert.equal(resolved.profile, cogniflowPresentationProfile);
  assert.equal(resolved.profile.id, "cogniflow-standardized-data-processing");
  assert.equal(resolved.view, "scroll");
  assert.equal(resolved.theme, "light");
  assert.equal(resolved.backgroundEnabled, true);
  assert.equal(resolved.backgroundFamilyId, "chemometrics-city");
  assert.equal(resolved.backgroundPackId, "chemometrics-city-light");
  assert.equal(resolved.diagramThemeId, "eco-city");
  assert.deepEqual(resolved.profile.presenterCapabilities, { clock: true, laserPointer: true });
  assert.equal(chemometricsPresentationProfile.presenterCapabilities, undefined);
  assert.equal(chemometricsCityFamily.label, "Eco City");
  assert.equal(chemometricsCityFamily.variants.light.label, "Eco City — Light");
  assert.equal(chemometricsCityFamily.variants.dark.label, "Eco City — Dark");
  assert.deepEqual(resolved.diagnostics, []);

  const dark = resolvePresentationAppearance("?theme=dark", COGNIFLOW_SOURCE_PATH_ID);
  assert.equal(dark.backgroundFamilyId, "chemometrics-city");
  assert.equal(dark.backgroundPackId, "chemometrics-city-dark");
  assert.equal(dark.diagramThemeId, "eco-city");
});

test("diagram theme follows the selected background family and disables with background none", () => {
  assert.equal(resolveDiagramThemeId("chemometrics-city", true), "eco-city");
  assert.equal(resolveDiagramThemeId("chemometrics-city", false), "neutral");
  assert.equal(resolveDiagramThemeId("missing", true), "neutral");
  assert.equal(resolveDiagramThemeId(undefined, true), "neutral");
});

test("theme query selects the matching concrete variant without changing family identity", () => {
  const light = resolvePresentationAppearance("?theme=light&background=chemometrics-city");
  const dark = resolvePresentationAppearance("?theme=dark&background=chemometrics-city");
  assert.equal(light.backgroundFamilyId, dark.backgroundFamilyId);
  assert.equal(light.backgroundFamilyId, "chemometrics-city");
  assert.equal(light.backgroundPackId, "chemometrics-city-light");
  assert.equal(dark.backgroundPackId, "chemometrics-city-dark");
  assert.equal(light.diagramThemeId, dark.diagramThemeId);
  assert.equal(light.diagramThemeId, "eco-city");
});

test("background none disables artwork and its coupled diagram theme while preserving family state", () => {
  const resolved = resolvePresentationAppearance("?background=none&theme=light");
  assert.equal(resolved.theme, "light");
  assert.equal(resolved.backgroundEnabled, false);
  assert.equal(resolved.backgroundFamilyId, "chemometrics-city");
  assert.equal(resolved.backgroundPackId, undefined);
  assert.equal(resolved.diagramThemeId, "neutral");
  assert.equal(resolveBackgroundPackId(resolved.backgroundFamilyId, resolved.theme), "chemometrics-city-light");
});

test("query overrides can force deck view independently from theme and background", () => {
  const resolved = resolvePresentationAppearance("?view=deck&background=none&theme=dark");
  assert.equal(resolved.view, "deck");
  assert.equal(resolved.theme, "dark");
  assert.equal(resolved.backgroundEnabled, false);
  assert.deepEqual(resolved.diagnostics, []);
});

test("unknown appearance overrides fail predictably to profile defaults", () => {
  const resolved = resolvePresentationAppearance("?view=wall&background=missing&theme=sepia");
  assert.equal(resolved.view, chemometricsPresentationProfile.defaultView);
  assert.equal(resolved.theme, chemometricsPresentationProfile.defaultTheme);
  assert.equal(resolved.backgroundFamilyId, chemometricsPresentationProfile.defaultBackgroundFamilyId);
  assert.equal(resolved.backgroundPackId, "chemometrics-city-dark");
  assert.equal(resolved.diagramThemeId, "eco-city");
  assert.equal(resolved.diagnostics.length, 3);
});

test("legacy neon-city URLs map to the new family without exposing a second selectable background", () => {
  const resolved = resolvePresentationAppearance("?background=chemometrics-neon-city&theme=light");
  assert.equal(resolved.backgroundFamilyId, "chemometrics-city");
  assert.equal(resolved.backgroundPackId, "chemometrics-city-light");
  assert.equal(resolved.diagramThemeId, "eco-city");
  assert.deepEqual(resolved.diagnostics, []);
});

test("every selectable background family has valid dark and light concrete packs", () => {
  const flattenedPackIds = new Set(backgroundPackRegistry.map((pack) => pack.id));
  for (const family of backgroundFamilyRegistry) {
    assert.doesNotThrow(() => validateThemedBackgroundPackFamily(family));
    assert.ok(family.variants.dark);
    assert.ok(family.variants.light);
    assert.notEqual(family.variants.dark.id, family.variants.light.id);
    assert.ok(flattenedPackIds.has(family.variants.dark.id));
    assert.ok(flattenedPackIds.has(family.variants.light.id));
  }
});

test("Eco City variants preserve parallax roles and use repository-local assets", () => {
  const expectedSpeeds = [0.08, 0.22, 0.27, 0.44, 0.72];
  for (const pack of [chemometricsCityFamily.variants.dark, chemometricsCityFamily.variants.light]) {
    assert.deepEqual(pack.layers.map((layer) => layer.speed), expectedSpeeds);
    assert.deepEqual(pack.layers.map((layer) => layer.id), ["bg-skyline", "facade-left", "facade-right", "bridges", "atmosphere"]);
    assert.ok(pack.layers.every((layer) => layer.asset.startsWith("/presentation-backgrounds/")));
    assert.ok(pack.layers.every((layer) => !layer.asset.startsWith("http")));
  }
  assert.deepEqual(chemometricsCityFamily.variants.light.layers.map((layer) => layer.asset), [
    `${LIGHT_ASSET_ROOT}bg-skyline.webp`,
    `${LIGHT_ASSET_ROOT}facade-left.webp`,
    `${LIGHT_ASSET_ROOT}facade-right.webp`,
    `${LIGHT_ASSET_ROOT}bridges.webp`,
    `${LIGHT_ASSET_ROOT}sunbeam-sky-overlay.webp`,
  ]);
});

test("theme styling is keyed independently from background activation and diagram family", () => {
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const backgroundStyles = readFileSync(new URL("../src/presentation-background.css", import.meta.url), "utf8");
  const flowStyles = readFileSync(new URL("../src/flow-theme.css", import.meta.url), "utf8");
  const chartStyles = readFileSync(new URL("../src/chart-theme.css", import.meta.url), "utf8");
  assert.match(styles, /data-presentation-theme="dark"/);
  assert.match(styles, /data-presentation-theme="light"/);
  assert.match(backgroundStyles, /body\.pcd-background-active/);
  assert.match(backgroundStyles, /var\(--pcd-foreground\)/);
  assert.match(flowStyles, /data-diagram-theme="eco-city"/);
  assert.match(chartStyles, /data-diagram-theme="eco-city"/);
  assert.doesNotMatch(backgroundStyles, /body\.pcd-background-active[^{]*\{[^}]*color:\s*#f6fbff/s);
});
