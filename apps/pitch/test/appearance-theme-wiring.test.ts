import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profileSource = readFileSync(new URL("../src/presentation-profile.ts", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("appearance controls wire distinct Alt+B and Alt+T shortcuts with idempotent teardown", () => {
  assert.match(profileSource, /key === "b"/);
  assert.match(profileSource, /toggleBackground\(\)/);
  assert.match(profileSource, /key === "t"/);
  assert.match(profileSource, /toggleTheme\(\)/);
  assert.match(profileSource, /themeSelect\.value === "dark" \? "light" : "dark"/);
  assert.match(profileSource, /if \(destroyed\) return;/);
  assert.match(profileSource, /window\.removeEventListener\("keydown", shortcut\)/);
});

test("main runtime stores theme separately from background enablement and updates URL state", () => {
  assert.match(mainSource, /let currentTheme: PresentationThemeMode = appearance\.theme/);
  assert.match(mainSource, /let backgroundEnabled = appearance\.backgroundEnabled/);
  assert.match(mainSource, /document\.body\.dataset\.presentationTheme = theme/);
  assert.match(mainSource, /url\.searchParams\.set\("theme", theme\)/);
  assert.match(mainSource, /url\.searchParams\.set\("background", backgroundEnabled/);
  assert.match(mainSource, /resolveBackgroundPackId\(selectedBackgroundFamilyId, currentTheme\)/);
});
