import type {SourceReference,DiagramBlock} from "./scene-document.ts";
import {binomialMass,specifiedSequenceProbability,arrangementCount} from "./binomial.ts";

/** An explicit iid Bernoulli teaching model, not measured samples or prevalence. */
export interface BinaryExperimentStage {
  readonly id:string;
  readonly prompt:string;
  readonly revealLevel:number;
  readonly trialCount?:number;
  readonly positiveProbability?:number;
  readonly arrangementIndex?:number;
  readonly caseIndex?:number;
  readonly seriesRun?:number;
  readonly source:readonly SourceReference[];
}
export interface BinaryExperiment {
  readonly id:string;
  readonly mode:"decision"|"series"|"sequence"|"arrangements"|"distribution"|"zero"|"assumptions";
  readonly targetCount?:number;
  readonly trialCount:number;
  readonly positiveProbability:number;
  readonly seed:number;
  readonly positiveLabel:string;
  readonly negativeLabel:string;
  readonly unitLabel:string;
  readonly trialName:string;
  readonly source:readonly SourceReference[];
  /** Ordered, authored lecture snapshots, including the initial stage. */
  readonly stages?:readonly BinaryExperimentStage[];
}
export function validateBinaryExperiment(model:BinaryExperiment):void {
  if(!model.id||!model.source.length||model.source.some(s=>!s.resourceId))throw new Error("Binary experiment identity and provenance required");
  if(!["decision","series","sequence","arrangements","distribution","zero","assumptions"].includes(model.mode))throw new Error("Unknown binary experiment mode");
  if(!Number.isInteger(model.trialCount)||model.trialCount<1||model.trialCount>100)throw new Error("Trial count must be an integer from 1 to 100");
  if(model.mode==="decision"&&model.trialCount!==1)throw new Error("Decision mode describes exactly one trial");
  if(!Number.isFinite(model.positiveProbability)||model.positiveProbability<0||model.positiveProbability>1)throw new Error("Positive probability must lie in [0,1]");
  if(!Number.isInteger(model.seed)||model.seed<0||model.seed>0xffffffff)throw new Error("Seed must be an unsigned 32-bit integer");
  for(const label of [model.positiveLabel,model.negativeLabel,model.unitLabel,model.trialName])if(typeof label!=="string"||!label.trim())throw new Error("Authored binary experiment labels required");
  if(model.positiveLabel===model.negativeLabel)throw new Error("Binary outcomes need distinct labels");
  if(model.targetCount!==undefined&&(!Number.isInteger(model.targetCount)||model.targetCount<0||model.targetCount>model.trialCount))throw new Error("Target count must be an integer within the trial count");
  if(["sequence","arrangements","distribution"].includes(model.mode)&&model.targetCount===undefined)throw new Error("This binary mode requires an authored target count");
  if(["sequence","arrangements"].includes(model.mode)&&model.trialCount>20)throw new Error("Arrangement examples are bounded to 20 trials");
  if(model.stages){
    if(model.stages.length<1||model.stages.length>30)throw new Error("Lecture requires 1 to 30 authored stages");
    if(new Set(model.stages.map(s=>s.id)).size!==model.stages.length)throw new Error("Duplicate lecture stage identity");
    for(const s of model.stages){
      if(!s.id||!s.prompt?.trim()||!s.source.length||s.source.some(ref=>!ref.resourceId))throw new Error("Authored lecture stage and provenance required");
      if(!Number.isInteger(s.revealLevel)||s.revealLevel<0||s.revealLevel>3)throw new Error("Invalid lecture reveal level");
      const n=s.trialCount??model.trialCount,p=s.positiveProbability??model.positiveProbability;
      if(!Number.isInteger(n)||n<1||n>100||!Number.isFinite(p)||p<0||p>1)throw new Error("Invalid lecture parameters");
      if(model.mode!=="distribution"&&(n!==model.trialCount||p!==model.positiveProbability))throw new Error("Only distribution stages change parameters");
      for(const value of [s.arrangementIndex,s.caseIndex,s.seriesRun])if(value!==undefined&&(!Number.isInteger(value)||value<0))throw new Error("Invalid lecture snapshot index");
      if(s.arrangementIndex!==undefined&&(model.mode!=="arrangements"||s.arrangementIndex>=arrangementCount(n,model.targetCount!)))throw new Error("Invalid lecture arrangement");
      if(s.caseIndex!==undefined&&model.mode!=="assumptions")throw new Error("Cases require assumptions mode");
      if(s.seriesRun!==undefined&&(model.mode!=="series"||s.seriesRun>20))throw new Error("Invalid lecture series run");
    }
  }
}

/** Reconstruct a snapshot from the same seeded stream, never from navigation history. */
export function binarySeriesAtStage(model:BinaryExperiment,stage:BinaryExperimentStage):BinarySeriesState {
  let state=initialBinarySeries(model);
  for(let run=0;run<(stage.seriesRun??0);run++){
    state=runBinarySeries(model,state);
    if(run<(stage.seriesRun??0)-1||stage.revealLevel>=1)state=revealBinaryCount(state);
    if(run<(stage.seriesRun??0)-1||stage.revealLevel>=2)state=collectBinaryCount(state);
  }
  return state;
}
/** Mulberry32, a deterministic teaching PRNG; each trial consumes a new draw. */
export function binaryRandom(state:number):{state:number;value:number}{
  if(!Number.isInteger(state)||state<0||state>0xffffffff)throw new Error("Invalid random state");
  const next=(state+0x6d2b79f5)>>>0;
  let t=Math.imul(next^(next>>>15),next|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return {state:next,value:((t^(t>>>14))>>>0)/4294967296};
}
export interface BinarySeriesState {
  readonly randomState:number;
  readonly run:number;
  readonly outcomes:readonly boolean[];
  readonly countVisible:boolean;
  readonly collected:readonly number[];
}
export function initialBinarySeries(model:BinaryExperiment):BinarySeriesState {
  validateBinaryExperiment(model);
  return {randomState:model.seed,run:0,outcomes:[],countVisible:false,collected:[]};
}
export function runBinarySeries(model:BinaryExperiment,state:BinarySeriesState):BinarySeriesState {
  validateBinaryExperiment(model);
  if(state.run!==state.collected.length)throw new Error("Collect the previous series before starting another");
  if(state.run>=1000)throw new Error("Reset after 1000 series");
  let randomState=state.randomState;const outcomes:boolean[]=[];
  for(let i=0;i<model.trialCount;i++){
    const next=binaryRandom(randomState);randomState=next.state;outcomes.push(next.value<model.positiveProbability);
  }
  return {...state,randomState,run:state.run+1,outcomes,countVisible:false};
}
export function revealBinaryCount(state:BinarySeriesState):BinarySeriesState {
  if(!state.outcomes.length)throw new Error("Run a series before revealing its count");
  return {...state,countVisible:true};
}
export function collectBinaryCount(state:BinarySeriesState):BinarySeriesState {
  if(!state.countVisible)throw new Error("Reveal the count before collecting it");
  if(state.run===state.collected.length)return state;
  return {...state,collected:[...state.collected,state.outcomes.filter(Boolean).length]};
}
export function binaryExperimentFallback(model:BinaryExperiment):string {
  validateBinaryExperiment(model);
  if(!["decision","series"].includes(model.mode)){
    const k=model.mode==="zero"?0:model.targetCount;
    return [`${model.trialCount} independent trials with constant positive-outcome probability ${model.positiveProbability}.`,
      ...(k===undefined?[]:[`Selected count: ${k}; model probability: ${binomialMass(model.trialCount,model.positiveProbability)[k]}.`]),
      ...(["sequence","arrangements"].includes(model.mode)?[`One specified sequence: ${specifiedSequenceProbability(model.trialCount,model.positiveProbability,k!)}; possible arrangements: ${arrangementCount(model.trialCount,k!)}.`]:[]),
      "Calculated teaching model, not observed measurements. Independence and comparable trial conditions are assumptions."].join("\n");
  }
  return [`${model.unitLabel}: ${model.positiveLabel} (1) or ${model.negativeLabel} (0). ${model.trialName}.`,
    `Teaching model: ${model.trialCount} independent units, constant positive-outcome probability ${100*model.positiveProbability} percent.`,
    `Reproducible model simulation, Mulberry32 with initial seed ${model.seed}. Not real measurements.`,
    "An outcome sequence and its success count are different representations. An average across many series does not guarantee a particular count in one series."].join("\n");
}

export function binaryDiagramFallback(block:DiagramBlock):string{
  if(!block.binaryExperiment)throw new Error("Binary diagram requires its model");
  return [block.label,block.description,binaryExperimentFallback(block.binaryExperiment),...block.nodes.map(node=>`${node.label}${node.description?": "+node.description:""}`),...(block.binaryExperiment.stages??[]).map(s=>s.prompt)].join("\n");
}
