import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {CanonicalRuntimeArtifact} from "../../../packages/core/src/canonical-runtime.ts";
import {createPitchCourseWorldModel,renderPitchCourseWorldHtml} from "../src/course-world.ts";

test("Quantiles and Moments has source-backed artwork through the existing world contract",()=>{
  const artifact=JSON.parse(readFileSync(new URL("../public/authoring-runtime.json",import.meta.url),"utf8")) as CanonicalRuntimeArtifact;
  const offering=artifact.teachingOfferingDocuments[0]!;
  const model=createPitchCourseWorldModel(offering,artifact.sceneDocuments,artifact.sceneDocumentBindings!,"en");
  const unit=model.units.find(u=>u.unitId.endsWith("/learning-unit-quantiles-moments-shape"))!;
  assert.equal(unit.thumbnail?.uri,"/course-world/quantiles-moments.svg");
  assert.equal(unit.thumbnail?.resourceId,"https://w3id.org/project-chemie-digital/resource/world-quantiles-moments-art");
  assert.equal(unit.thumbnail?.graphId,"https://w3id.org/project-chemie-digital/graph/specifications/course-world-artwork");
  assert.match(unit.thumbnail!.alternativeText,/Decorative, not measurement data/u);
  assert.equal(unit.status,"available");
  const html=renderPitchCourseWorldHtml(model);
  assert.match(html,/src="\/course-world\/quantiles-moments\.svg"/u);
  assert(html.includes(unit.thumbnail!.alternativeText));
  assert.equal(model.units.filter(u=>u.thumbnail).length,5);
});

test("the local thumbnail is a small self-contained SVG matching the existing island canvas",()=>{
  const svg=readFileSync(new URL("../public/course-world/quantiles-moments.svg",import.meta.url),"utf8");
  assert.match(svg,/viewBox="0 0 360 200"/u);
  assert.match(svg,/<title[^>]*>Quantiles and statistical moments<\/title>/u);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|(?:href|src)=["'](?:https?:|data:)|\u2014/iu);
  assert(Buffer.byteLength(svg)<5000);
});
