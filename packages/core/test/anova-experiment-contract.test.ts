import assert from 'node:assert/strict';
import test from 'node:test';
import {experimentFallback,parameterValues,runExperiment,validateExperiment,type ExperimentBlock,type ExperimentParameter} from '../src/distribution-experiment.ts';
import {assertSceneDocumentStructure,SceneContractError} from '../src/scene-contract.ts';
import {validateSceneDocument,type SceneDocument} from '../src/scene-document.ts';
import {SCENE_DOCUMENT_VERSIONS,isSceneDocumentVersion,supportsSceneCapability} from '../src/scene-version.ts';

const source=[{resourceId:'ex:preparations',provenanceIds:['ex:authored'],relationPath:'ex:response'}];
function parameter(key:string,value:number,maximum:number):ExperimentParameter {
  return {id:`parameter-${key}`,key,label:key,value,minimum:0,maximum,step:key==='view'?1:0.1,adjustable:true,source};
}
function block():ExperimentBlock {
  return {
    id:'anova',kind:'chart',chartType:'experiment',experimentKind:'anova-one-way',
    label:'Independent preparation comparison',description:'Compare responses from two preparation groups.',source,
    xAxis:{label:'Preparation method'},yAxis:{label:'Measured concentration',unit:'mg/L'},differenceUnit:'mg/L difference',
    parameters:[parameter('betweenScale',1,3),parameter('withinScale',1,3),parameter('view',0,2)],
    groups:[
      {id:'method-a',label:'Method A',source,data:[1,2,3].map((value,i)=>({id:`a-${i}`,label:`Preparation A${i+1}`,value,source}))},
      {id:'method-b',label:'Method B',source,data:[4,5,6].map((value,i)=>({id:`b-${i}`,label:`Preparation B${i+1}`,value,source}))},
    ],
  };
}
function document(b:ExperimentBlock=block(),version:SceneDocument['version']='1.15'):SceneDocument {
  return {version,id:'document',sourcePathId:'ex:path',scenes:[{id:'scene',source,blocks:[b],readingOrder:[b.id]}]};
}
function copy<T>(value:T):T {return JSON.parse(JSON.stringify(value));}
function readout(b:ExperimentBlock,label:string,overrides:Readonly<Record<string,number>>={}):number|string {
  const result=runExperiment(b,overrides).readouts.find(value=>value.label===label);
  assert.ok(result,`Missing readout: ${label}`);
  return result.value;
}
function near(actual:number|string,expected:number,tolerance=1e-12):void {
  assert.equal(typeof actual,'number');
  assert.ok(Math.abs(Number(actual)-expected)<=tolerance,`${actual} differs from ${expected}`);
}
function legacy():ExperimentBlock {
  return {
    id:'pearson',kind:'chart',chartType:'experiment',experimentKind:'pearson',source,
    label:'Category counts',description:'Compare three category counts.',
    xAxis:{label:'Category'},yAxis:{label:'Count'},
    parameters:[parameter('mode',0,1),parameter('view',1,1)],
    data:[9,10,11].map((y,i)=>({x:10,y,z:10,label:`Category ${i+1}`,source})),
  };
}

test('generic JSON roundtrip preserves grouped identities, labels and complete provenance without mutation',()=>{
  const original=document();
  const json=JSON.stringify(original);
  const decoded:unknown=JSON.parse(json);
  assertSceneDocumentStructure(decoded);
  validateSceneDocument(decoded);
  assert.deepEqual(decoded,original);
  const transported=decoded.scenes[0].blocks[0];
  assert.equal(transported.kind,'chart');
  if(transported.kind!=='chart'||transported.chartType!=='experiment')assert.fail('Expected an experiment');
  assert.deepEqual(transported.groups,block().groups);
  assert.equal(transported.groups![0].data[0].id,'a-0');
  assert.deepEqual(transported.groups![1].data[2].source,source);
  runExperiment(transported,{betweenScale:2,view:1});
  assert.equal(JSON.stringify(original),json);
  assert.equal(JSON.stringify(decoded),json);
});

test('grouped capability starts precisely at 1.15, including recursively nested blocks',()=>{
  assert.equal(isSceneDocumentVersion('1.15'),true);
  assert.equal(isSceneDocumentVersion('1.16'),false);
  for(const version of SCENE_DOCUMENT_VERSIONS){
    assert.equal(supportsSceneCapability(version,'groupedExperiments'),version==='1.15');
    if(version==='1.15')assert.doesNotThrow(()=>validateSceneDocument(document(block(),version)));
    else assert.throws(()=>validateSceneDocument(document(block(),version)),/Grouped scientific experiments require SceneDocument 1.15/);
  }
  assert.throws(()=>validateSceneDocument({...document(),version:'1.16'}),SceneContractError);
  const b=block();
  const nested={...document(),scenes:[{id:'scene',source,blocks:[{id:'outer',kind:'group',source,children:[{id:'inner',kind:'group',source,children:[b],readingOrder:[b.id]}],readingOrder:['inner']}],readingOrder:['outer']}]};
  assert.doesNotThrow(()=>validateSceneDocument(nested));
  assert.throws(()=>validateSceneDocument({...nested,version:'1.14'}),/require SceneDocument 1.15/);
});

test('legacy mechanisms retain their original version gate and numerical behavior',()=>{
  const b=legacy();
  const expected=runExperiment(b);
  for(const version of ['1.14','1.15'] as const){
    assert.doesNotThrow(()=>validateSceneDocument(document(b,version)));
    assert.deepEqual(runExperiment(b),expected);
  }
  near(readout(b,'Pearson statistic'),0.2);
  assert.throws(()=>validateSceneDocument(document(b,'1.13')),/require SceneDocument 1.14/);
  assert.throws(()=>validateSceneDocument(document({...b,groups:block().groups})),SceneContractError);
  assert.throws(()=>validateSceneDocument(document({...b,differenceUnit:'count'})),SceneContractError);
  assert.throws(()=>runExperiment({...b,groups:block().groups}),/require anova-one-way/);
  assert.throws(()=>parameterValues({...b,differenceUnit:'count'}),/require anova-one-way/);
});

test('strict grouped transport identifies malformed nested typed fields',()=>{
  const cases:Array<[string,(b:any)=>void]>=[
    ['groups',b=>{b.groups={};}],
    ['groups[0].data',b=>{b.groups[0].data=null;}],
    ['groups[0].data[0].value',b=>{b.groups[0].data[0].value='1';}],
    ['groups[0].data[0].label',b=>{b.groups[0].data[0].label=1;}],
    ['groups[0].data[0].source[0].resourceId',b=>{b.groups[0].data[0].source[0].resourceId=4;}],
    ['groups[0].source[0].provenanceIds[0]',b=>{b.groups[0].source[0].provenanceIds[0]=4;}],
    ['differenceUnit',b=>{b.differenceUnit=3;}],
  ];
  for(const [path,change] of cases){
    const b=copy(block());change(b);
    assert.throws(()=>assertSceneDocumentStructure(document(b)),(error:unknown)=>error instanceof SceneContractError&&error.message.includes(path),path);
  }
});

test('semantic validation rejects missing units, duplicate identities, mixed data and unsupported group decorations',()=>{
  const cases:Array<[string,(b:any)=>void]>=[
    ['missing groups',b=>{delete b.groups;}],
    ['too few groups',b=>{b.groups.pop();}],
    ['too few observations',b=>{b.groups[0].data.pop();b.groups[0].data.pop();}],
    ['duplicate group',b=>{b.groups[1].id=b.groups[0].id;}],
    ['duplicate observation across groups',b=>{b.groups[1].data[0].id=b.groups[0].data[0].id;}],
    ['missing observation source',b=>{b.groups[0].data[0].source=[];}],
    ['blank group label',b=>{b.groups[0].label=' ';}],
    ['blank response unit',b=>{b.yAxis.unit=' ';}],
    ['missing response unit',b=>{delete b.yAxis.unit;}],
    ['blank difference unit',b=>{b.differenceUnit=' ';}],
    ['missing difference unit',b=>{delete b.differenceUnit;}],
    ['flat data',b=>{b.data=[];}],
    ['numeric group position',b=>{b.groups[0].x=1;}],
    ['published summary',b=>{b.groups[0].summary={id:'summary',label:'Mean',value:2,source};}],
    ['published interval',b=>{b.groups[0].interval={id:'interval',label:'Range',lower:1,upper:3,source};}],
  ];
  for(const [name,change] of cases){
    const b=copy(block());change(b);
    assert.throws(()=>validateSceneDocument(document(b)),SceneContractError,name);
    assert.throws(()=>runExperiment(b),undefined,name);
  }
  const b=copy(block());
  (b.groups![0].data[0] as {value:number}).value=Infinity;
  assert.throws(()=>runExperiment(b),/finite/);
});

test('required parameters, unknown keys, initial values and overrides all use bounded ANOVA validation',()=>{
  const b=block();
  assert.deepEqual(parameterValues(b),{betweenScale:1,withinScale:1,view:0});
  for(const key of ['betweenScale','withinScale','view']){
    assert.throws(()=>validateExperiment({...b,parameters:b.parameters.filter(p=>p.key!==key)}));
  }
  assert.throws(()=>runExperiment({...b,parameters:[...b.parameters,parameter('unknown',0,1)]}),/unknown/i);
  assert.throws(()=>runExperiment(b,{unknown:1}),/Unknown or fixed/);
  const fixed={...b,parameters:b.parameters.map(p=>p.key==='betweenScale'?{...p,adjustable:false}:p)};
  assert.throws(()=>runExperiment(fixed,{betweenScale:1}),/Unknown or fixed/);
  for(const overrides of [{view:0.5},{view:3},{view:-1},{betweenScale:-0.1},{betweenScale:3.1},{withinScale:-1},{withinScale:4},{betweenScale:NaN},{withinScale:Infinity}]){
    assert.throws(()=>parameterValues(b,overrides));
    assert.throws(()=>runExperiment(b,overrides));
  }
  for(const replacement of [{value:0.5,key:'view'},{value:4,key:'betweenScale'},{minimum:NaN,key:'withinScale'},{maximum:Infinity,key:'betweenScale'},{minimum:-1,key:'withinScale'}]){
    const invalid={...b,parameters:b.parameters.map(p=>p.key===replacement.key?{...p,...replacement}:p)};
    assert.throws(()=>validateExperiment(invalid));
    assert.throws(()=>runExperiment(invalid));
  }
  const narrow={...b,parameters:b.parameters.map(p=>p.key==='betweenScale'?{...p,maximum:1.5}:p)};
  assert.throws(()=>runExperiment(narrow,{betweenScale:2}),/outside authored bounds/);
  assert.doesNotThrow(()=>runExperiment(b,{betweenScale:0,withinScale:0,view:2}));
  assert.doesNotThrow(()=>runExperiment(b,{betweenScale:3,withinScale:3,view:2}));
});

test('execution fits actual authored observations and refits overrides with exact identity reset',()=>{
  const b=block();
  near(readout(b,'N'),6);
  near(readout(b,'k'),2);
  near(readout(b,'SS between (mg/L difference)²'),13.5);
  near(readout(b,'SS within (mg/L difference)²'),4);
  near(readout(b,'F'),13.5);
  near(readout(b,'p-value'),0.0213116411287567);
  const initial=runExperiment(b);
  assert.equal(initial.panels[0].xLabel,'Preparation method');
  assert.equal(initial.panels[0].yLabel,'Measured concentration (mg/L)');
  assert.deepEqual(initial.panels[0].xLabels,[{value:1,label:'Method A'},{value:2,label:'Method B'}]);
  assert.deepEqual(initial.panels[0].traces.find(t=>t.label==='Method A')!.points.map(p=>p.y),[1,2,3]);
  near(readout(b,'F',{betweenScale:2}),54);
  near(readout(b,'F',{withinScale:2}),3.375);
  const changed={...b,groups:b.groups!.map(g=>g.id==='method-b'?{...g,data:g.data.map(d=>({...d,value:d.value+3}))}:g)};
  near(readout(changed,'F'),54);
  runExperiment(b,{betweenScale:0.4,withinScale:2.3,view:1});
  assert.deepEqual(runExperiment(b,{betweenScale:1,withinScale:1,view:0}),initial);
  const rounded={...b,groups:b.groups!.map(g=>({...g,data:g.data.map((d,i)=>({...d,value:g.id==='method-a'?[0.1,0.2,0.3][i]:[0.4,0.5,0.6][i]}))}))};
  const exact=runExperiment(rounded,{betweenScale:1,withinScale:1});
  for(const group of rounded.groups!){
    assert.deepEqual(exact.panels[0].traces.find(t=>t.label===group.label)!.points.map(p=>p.y),group.data.map(d=>d.value));
  }
});

test('all views preserve inference and zero-error cases remain explicitly undefined',()=>{
  const b=block();
  for(const view of [0,1,2]){
    near(readout(b,'F',{view}),13.5);
    near(readout(b,'p-value',{view}),0.0213116411287567);
  }
  assert.equal(runExperiment(b,{view:1}).panels[0].yLabel,'Departure from grand mean (mg/L difference)');
  assert.equal(runExperiment(b,{view:2}).panels[0].xLabel,'F statistic');
  const zero=runExperiment(b,{withinScale:0,view:2});
  assert.equal(zero.readouts.find(r=>r.label==='F')!.value,'Undefined');
  assert.equal(zero.readouts.find(r=>r.label==='p-value')!.value,'Undefined');
  assert.equal(zero.panels.length,0);
});

test('fallback contains complete current numerical readouts, units and authored axis labels',()=>{
  const baseline=block();
  const b={...baseline,parameters:baseline.parameters.map(p=>p.key==='betweenScale'?{...p,value:2}:p)};
  const result=runExperiment(b);
  near(readout(b,'F'),54);
  const fallback=experimentFallback(b);
  for(const readout of result.readouts)assert.ok(fallback.includes(`${readout.label}: ${readout.value}`),readout.label);
  for(const text of ['Independent preparation comparison','Preparation method','Measured concentration (mg/L)','mg/L difference','Method A','Method B','F: 54'])assert.ok(fallback.includes(text),text);
  for(const trace of result.panels[0].traces){
    for(const point of trace.points)assert.ok(fallback.includes(`${point.x}: ${point.y}`));
  }
  assert.ok(fallback.includes('not new measured preparations'));
  assert.ok(fallback.includes('independent preparations'));
});
