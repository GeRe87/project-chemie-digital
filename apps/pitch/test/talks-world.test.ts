import assert from "node:assert/strict";
import test from "node:test";
import { renderTalksWorld, resolveTalks, type PresentationCollection } from "../src/talks-world.ts";
import { renderScientificTitle } from "../../../packages/renderer-reveal/src/scientific-title.ts";
import { validatePresentationTitle, type PresentationTitleMetadata } from "../../../packages/core/src/presentation-metadata.ts";
import { resolvePresentationAppearance, availableBackgroundFamilies, chemometricsPresentationProfile, talksPresentationProfile, talksLaboratoryFamily } from "../src/presentation-profile.ts";
import { validateBackgroundPack, layerOffset } from "../../../packages/renderer-reveal/src/background/background-pack.ts";
import { mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

const base = "https://example.org/";
const collection: PresentationCollection = { version: "1.0", id: base+"collection", graphId:base+"graph", title:"Talks Overworld", talks:[{id:base+"talk", title:"Scientific <talk>",pathId:base+"path",pathGraphId:base+"path-graph"}] };
const documents = [{id:"document",pathId:"path",sceneIds:["title"],runtime:"course-runtime/example.json"}];
const bindings = [{pathId:base+"path",pathGraphId:base+"path-graph",sceneDocumentId:"document"}];
const metadata: PresentationTitleMetadata = { version:"1.0", id:base+"talk",title:"Scientific <title>", authors:[{id:base+"author",name:"First author",affiliations:[]}], logos:[],source:[{resourceId:base+"talk"}] };

test("collection renders exactly one bound talk without teaching levels", () => {
  const html = renderTalksWorld(collection, resolveTalks(collection,documents,bindings));
  assert.equal((html.match(/data-scene-document-id=/g)??[]).length,1);
  assert.match(html,/Scientific &lt;talk&gt;/);
  assert.match(html,/Future Talks/);
  assert.doesNotMatch(html,/Level 0|Start level/);
});
test("collection rejects duplicate identities, missing and wrong-graph bindings", () => {
  assert.throws(()=>resolveTalks({...collection,talks:[...collection.talks,...collection.talks]},documents,bindings));
  assert.throws(()=>resolveTalks(collection,documents,[]));
  assert.throws(()=>resolveTalks(collection,documents,[{...bindings[0]!,pathGraphId:base+"other"}]));
  assert.throws(()=>resolveTalks(collection,[...documents,...documents],bindings));
});
test("standard title supports absent optional data, escaping, multiple authors and logos", () => {
  const minimal = renderScientificTitle(metadata);
  assert.match(minimal,/Scientific &lt;title&gt;/);
  assert.doesNotMatch(minimal,/undefined|scientific-title-event|scientific-title-logos/);
  const expanded: PresentationTitleMetadata = {...metadata,event:{id:base+"event",name:"Meeting",date:"2026-10-25",location:"Essen"},authors:[...metadata.authors,{id:base+"author2",name:"Second author",affiliations:[{id:base+"affiliation",lines:["University","Faculty"]}]}],logos:[{id:base+"logo",label:"Approved logo",uri:"/assets/logo.svg"},{id:base+"placeholder",label:"Logo placeholder"}]};
  const html = renderScientificTitle(expanded, uri=>"/resolved"+uri);
  assert.equal((html.match(/data-author-id=/g)??[]).length,2);
  assert.match(html,/University<br>Faculty/);
  assert.match(html,/src="\/resolved\/assets\/logo.svg"/);
  assert.match(html,/Logo placeholder/);
  assert.throws(()=>validatePresentationTitle({...metadata,logos:[{id:base+"bad",label:"Bad",uri:"https://unofficial.example/logo.svg"}]}));
});
test("Talks uses a configurable horizontal deck and aligned themed packs", () => {
  const appearance = resolvePresentationAppearance("",undefined,talksPresentationProfile);
  assert.equal(appearance.view,"deck");
  assert.equal(appearance.profile.backgroundProgressAxis,"horizontal");
  assert.equal(resolvePresentationAppearance("?view=scroll",undefined,talksPresentationProfile).view,"deck");
  assert.deepEqual(availableBackgroundFamilies(talksPresentationProfile).map(f=>f.id),["talks-laboratory"]);
  assert.deepEqual(availableBackgroundFamilies(chemometricsPresentationProfile).map(f=>f.id),["chemometrics-city"]);
  assert.equal(resolvePresentationAppearance("?background=chemometrics-city",undefined,talksPresentationProfile).backgroundFamilyId,"talks-laboratory");
  const dark=talksLaboratoryFamily.variants.dark, light=talksLaboratoryFamily.variants.light;
  validateBackgroundPack(dark); validateBackgroundPack(light);
  assert.deepEqual(dark.layers.map(l=>[l.id,l.speed,l.repeat,l.sizing]),light.layers.map(l=>[l.id,l.speed,l.repeat,l.sizing]));
  assert.deepEqual(dark.layers.map(l=>layerOffset(l,100)),[-12,-33,-61]);
  assert.deepEqual(dark.layers.map(l=>layerOffset(l,100,true)),[0,0,0]);
});

test("the existing scene mount selects the shared title layout and preserves provenance and accessible naming", () => {
  class Element implements MinimalElement {
    innerHTML=""; className=""; textContent:string|null=null; children:Element[]=[]; attributes=new Map<string,string>();
    appendChild(node:MinimalElement) { this.children.push(node as Element); }
    setAttribute(name:string,value:string) { this.attributes.set(name,value); }
  }
  const source=[{resourceId:base+"work",provenanceIds:[base+"graph"]}];
  const root=new Element();
  const cleanup=mountSceneDocuments({root,createElement:()=>new Element()},[{version:"1.0",id:"document",sourcePathId:"path",scenes:[{
    id:"scene",source,blocks:[{id:"heading",kind:"prose",text:"Title",intent:{kind:"introduce"},source}],readingOrder:["heading"],presentationTitle:metadata,
  }]}]);
  assert.match(root.children[0]!.innerHTML,/First author/);
  assert.equal(root.children[0]!.attributes.get("aria-label"),metadata.title);
  assert.equal(root.children[0]!.attributes.get("data-provenance-ids"),base+"graph");
  cleanup();
});
