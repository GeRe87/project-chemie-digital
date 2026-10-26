import test from "node:test";
import assert from "node:assert/strict";
import { validateCanonicalRuntimeArtifact } from "../src/canonical-runtime.ts";
import { validatePresentationTitle, type PresentationTitleMetadata } from "../src/presentation-metadata.ts";

const base="https://example.org/";
const title: PresentationTitleMetadata={version:"1.0",id:base+"work",title:"Title",authors:[{id:base+"person",name:"Author",affiliations:[]}],logos:[],source:[{resourceId:base+"work"}]};
function artifact() {
  return {artifactVersion:"1.0",datasetFingerprint:`sha256:${"0".repeat(64)}`,datasetSnapshot:{},teachingOfferingDocuments:[],
    sceneDocuments:[{version:"1.0",id:"document",sourcePathId:"path",scenes:[{id:"scene",source:[{resourceId:base+"scene"}],blocks:[{id:"heading",kind:"prose",text:"Title",source:[{resourceId:base+"work"}]}],readingOrder:["heading"],presentationTitle:title}]}],
    sceneDocumentBindings:[{pathId:base+"path",pathGraphId:base+"graph",sceneDocumentId:"document"}],
    presentationCollection:{version:"1.0",id:base+"collection",graphId:base+"collection-graph",title:"Collection",talks:[{id:base+"work",title:"Title",pathId:base+"path",pathGraphId:base+"graph"}]}};
}
test("canonical runtime accepts independent scientific collections without fabricated teaching offerings",()=>{
  const value=artifact(); assert.equal(validateCanonicalRuntimeArtifact(value),value);
});
test("canonical runtime checks collection membership against exact bindings",()=>{
  const value=artifact(); value.presentationCollection.talks[0]!.pathGraphId=base+"wrong-graph";
  assert.throws(()=>validateCanonicalRuntimeArtifact(value),/exact path\/graph binding/);
});
test("title metadata fails closed for missing authors, affiliations and unsafe logos",()=>{
  validatePresentationTitle(title);
  assert.throws(()=>validatePresentationTitle({...title,authors:[]}));
  assert.throws(()=>validatePresentationTitle({...title,authors:[{id:base+"author",name:"Author",affiliations:[{id:base+"organization",lines:[]}]}]}));
  assert.throws(()=>validatePresentationTitle({...title,logos:[{id:base+"logo",label:"Logo",uri:"/assets/../untrusted.svg"}]}));
  assert.throws(()=>validatePresentationTitle({...title,logos:[{id:base+"logo",label:"Logo",uri:"//unofficial.example/logo.svg"}]}));
  const value=artifact(); value.sceneDocuments[0]!.scenes[0]!.presentationTitle={...title,authors:[]};
  assert.throws(()=>validateCanonicalRuntimeArtifact(value),/scientific title metadata/);
});
