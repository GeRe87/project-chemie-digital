import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {talksPresentationProfile,resolvePresentationAppearance,chemometricsPresentationProfile} from "../src/presentation-profile.ts";

test("Talks opts into existing readable lecture typography without changing course navigation",()=>{
  assert.equal(talksPresentationProfile.defaultReadability,"lecture");
  assert.equal(talksPresentationProfile.showToolbar,false);
  assert.equal(resolvePresentationAppearance("",undefined,talksPresentationProfile).view,"deck");
  assert.equal(chemometricsPresentationProfile.defaultView,"scroll");
});
test("classic decks allocate controls and native portrait uses available presentation dimensions",()=>{
  const styles=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
  const runtime=readFileSync(new URL("../src/presentation-main.ts",import.meta.url),"utf8");
  assert.match(styles,/body\.reveal-viewport:not\(\.reveal-scroll\)[\s\S]*?flex-direction: column/);
  assert.match(styles,/:has\(> \.pcd-return-world\)/);
  assert.match(runtime,/presentation\.clientHeight/);
  assert.match(runtime,/presentation\.clientWidth/);
  assert.match(runtime,/nativeViewportObserver\?\.disconnect\(\)/);
});
test("chart and concise footer fit a bounded deck canvas without semantic identity selectors",()=>{
  const css=readFileSync(new URL("../src/visual-stage-primitives.css",import.meta.url),"utf8");
  assert.match(css,/body:not\(\.reveal-scroll\)[\s\S]*?:has\(\.d3-chart-host\)/);
  assert.match(css,/\.d3-chart-figure\s*\{[^}]*grid-template-rows: minmax\(0, 1fr\) auto/s);
  assert.doesNotMatch(css,/ted-scene|talk-microplastics|ted-marker/);
});
test("interactive flow nodes are not hidden inside a single image role",()=>{
  const source=readFileSync(new URL("../../../packages/renderer-d3/src/flow-diagram.ts",import.meta.url),"utf8");
  assert.match(source,/svg\.setAttribute\("role", model\.interactionPolicy === "keyboard" \? "group" : "img"\)/);
});
