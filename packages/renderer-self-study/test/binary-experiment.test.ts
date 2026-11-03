import {test} from "node:test";
import assert from "node:assert/strict";
import {createSelfStudyRenderPlan,renderSelfStudyHtml} from "../src/index.ts";
import {createRevealRenderPlan} from "../../renderer-reveal/src/index.ts";
import type {SceneDocument} from "../../core/src/scene-document.ts";

test("binary experiment diagrams retain model and reproducibility text in static adapters",()=>{
  const source=[{resourceId:"urn:experiment"}];
  const document:SceneDocument={version:"1.13",id:"doc",sourcePathId:"path",scenes:[{id:"scene",source,blocks:[{id:"diagram",kind:"diagram",diagramType:"flow",label:"Binary result",description:"Teaching model",source,nodes:[{id:"a",label:"Sample",source},{id:"b",label:"Decision",source}],edges:[{id:"ab",label:"analyse",sourceNodeId:"a",targetNodeId:"b",source}],binaryExperiment:{id:"experiment",mode:"series",trialCount:10,positiveProbability:.2,seed:20261030,positiveLabel:"positive",negativeLabel:"negative",unitLabel:"Sample",trialName:"Bernoulli trial",source}}],readingOrder:["diagram"]}]};
  const result=createSelfStudyRenderPlan(document);
  assert.deepEqual(result.diagnostics,[]);
  const html=renderSelfStudyHtml(result.plan!,{interactive:false});
  assert.match(html,/20261030/);assert.match(html,/20 percent/);assert.match(html,/Not real measurements/);
  const reveal=createRevealRenderPlan(document,{reducedMotion:true,interactionPolicy:"static"});
  assert.deepEqual(reveal.diagnostics,[]);
});
