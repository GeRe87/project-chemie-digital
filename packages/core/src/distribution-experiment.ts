import type {SceneBlockBase,ChartAxis,SourceReference} from './scene-document.ts';
import {normalPdf,normalCdf,normalQuantile,studentPdf,studentCdf,fPdf,fCdf,chiPdf,gammaQ,quantile,mean,variance,seededUniform,empiricalQuantile} from './distribution-math.ts';
export const experimentKinds=['distribution','ecdf','signed','normal','means','factors','lognormal','squares','variance','student','f-ratio','dilution','calibration','stress','pearson'] as const;
export type ExperimentKind=typeof experimentKinds[number];
export interface ExperimentParameter {readonly id:string;readonly key:string;readonly label:string;readonly value:number;readonly minimum:number;readonly maximum:number;readonly step:number;readonly adjustable:boolean;readonly source:readonly SourceReference[];}
export interface ExperimentBlock extends SceneBlockBase {
  readonly kind:'chart';readonly chartType:'experiment';readonly experimentKind:ExperimentKind;readonly label:string;readonly description:string;
  readonly xAxis:ChartAxis;readonly yAxis:ChartAxis;readonly parameters:readonly ExperimentParameter[];
  readonly data?:readonly {readonly x:number;readonly y:number;readonly z?:number;readonly label:string;readonly source:readonly SourceReference[]}[];
}
const required:Record<ExperimentKind,readonly string[]>={distribution:['location','scale','threshold','width','probability','M','seed','view','family'],ecdf:['M','mu','sigma','seed','threshold'],signed:['n','sigma','overlay'],normal:['mu','sigma','threshold','alpha','inverse'],means:['mu','sigma','n'],factors:['start','factor','delta','steps','mode'],lognormal:['reference','logSd','threshold','alpha','inverse'],squares:['df','M','seed'],variance:['n','M','sigma','seed','observed'],student:['n','M','sigma','seed','departure','observedSd'], 'f-ratio':['nA','nB','M','sigma','seed','ratio','alpha','reverse'],dilution:['M','seed','signal','signalSd','slope','intercept','pipette','pipetteHalf','flask','flaskHalf','source'],calibration:['showQuadratic'],stress:['n','sigma','seed','mode'],pearson:['mode']};
function requiredParameters(b:ExperimentBlock):readonly string[]{
  const view=b.parameters.find(p=>p.key==='view')?.value;
  if(b.experimentKind==='student'&&view===4)return ['n','M','sigma','seed'];
  if(b.experimentKind==='f-ratio'&&view===3)return ['nA','nB','M','sigma','seed','reverse'];
  return required[b.experimentKind];
}
export function validateExperiment(b:ExperimentBlock):void {
  if(!experimentKinds.includes(b.experimentKind)||!b.label||!b.description||!b.source.length||!b.parameters.length)throw Error('Experiment requires a supported scientific mechanism, text and provenance');
  const keys=new Set<string>();for(const p of b.parameters){if(!p.id||!p.label||!p.source.length||keys.has(p.key)||![p.value,p.minimum,p.maximum,p.step].every(Number.isFinite)||p.step<=0||p.minimum>p.value||p.maximum<p.value||typeof p.adjustable!=='boolean')throw Error('Invalid authored experiment parameter');keys.add(p.key);}
  if(requiredParameters(b).some(k=>!keys.has(k)))throw Error(`Missing parameter for ${b.experimentKind}`);
  if(b.data?.some(d=>![d.x,d.y,...(d.z===undefined?[]:[d.z])].every(Number.isFinite)||!d.label||!d.source.length))throw Error('Invalid experiment observations');
  if((b.experimentKind==='calibration'||b.experimentKind==='pearson')&&(!b.data||b.data.length<3))throw Error('This experiment needs authored paired data');
  // Validate initial execution as well as the transport. Runtime overrides repeat these checks.
  parameterValues(b);
}
export function parameterValues(b:ExperimentBlock,overrides:Readonly<Record<string,number>>={}):Record<string,number> {
  const expected=[...requiredParameters(b),...(b.experimentKind==='stress'?['mu','outlierShift','drift']:[])];
  const optional:Partial<Record<ExperimentKind,readonly string[]>>={normal:['view','comparisonSigma','band'],lognormal:['view'],signed:['comparisonN'],stress:['view'],means:['comparisonN'],variance:['comparisonN'],student:['view','comparisonN','reference'],'f-ratio':['view'],calibration:['view'],pearson:['view']};
  if(expected.some(k=>!b.parameters.some(p=>p.key===k))||b.parameters.some(p=>![...expected,...(optional[b.experimentKind]??[])].includes(p.key)))throw Error('Missing or unknown experiment parameter');
  if(Object.keys(overrides).some(k=>!b.parameters.some(p=>p.key===k&&p.adjustable)))throw Error('Unknown or fixed experiment parameter');
  const v:Record<string,number>={};for(const p of b.parameters){const x=overrides[p.key]??p.value;if(!Number.isFinite(x)||x<p.minimum||x>p.maximum)throw Error(`Parameter outside authored bounds: ${p.label}`);if(['view','comparisonN','band','n','nA','nB','M','df','seed','steps','mode','overlay','inverse','reverse','source','showQuadratic'].includes(p.key)&&!Number.isInteger(x))throw Error('This experiment parameter must be an integer');v[p.key]=x;}
  const maxView:Partial<Record<ExperimentKind,number>>={distribution:2,normal:5,lognormal:3,student:4,'f-ratio':3,calibration:2,stress:1,pearson:1};
  if('view'in v&&(v.view<0||v.view>(maxView[b.experimentKind]??-1)))throw Error('Unknown scientific view');
  if(b.experimentKind==='normal'&&v.view===4&&!(v.comparisonSigma>0))throw Error('Device comparison requires an authored positive comparison SD');
  if(b.experimentKind==='normal'&&v.view===3&&!(v.band>=1&&v.band<=3))throw Error('Coverage requires an authored band in [1,3]');
  if(b.experimentKind==='student'&&v.view===3&&!('reference'in v))throw Error('Concentration interval requires an authored reference');
  for(const k of ['sigma','logSd','reference','start','factor','slope','pipette','flask','observedSd'])if(k in v&&v[k]<=0)throw Error(`${k} must be positive`);
  for(const k of ['n','nA','nB','comparisonN'])if(k in v&&(v[k]<2||v[k]>200))throw Error('Measurement count must be in [2,200]');
  if('df'in v&&(v.df<1||v.df>200))throw Error('Invalid degrees of freedom');
  if('M'in v&&(v.M<(b.experimentKind==='dilution'?1:2)||v.M>10000||v.M*((v.n??v.df??((v.nA??0)+(v.nB??0)||1))+(v.comparisonN??0))>2000000))throw Error('Simulation exceeds bounded work budget');
  for(const k of ['overlay','inverse','reverse','showQuadratic'])if(k in v&&![0,1].includes(v[k]))throw Error('Boolean mode must be 0 or 1');
  if('mode'in v&&(v.mode<0||v.mode>(['factors','stress'].includes(b.experimentKind)?2:1)))throw Error('Unknown experiment mode');
  if('source'in v&&![0,1,2].includes(v.source))throw Error('Unknown uncertainty source');
  if('steps'in v&&(v.steps<1||v.steps>100))throw Error('Steps must be in [1,100]');
  if('seed'in v&&(v.seed<1||v.seed>=2147483647))throw Error('Invalid Park-Miller seed');
  if('alpha'in v&&!(v.alpha>0&&v.alpha<1))throw Error('Alpha must be strictly inside (0,1)');
  if(b.experimentKind==='distribution'&&(!(v.scale>0)||!(v.width>0)||!(v.probability>0&&v.probability<1)||![0,1].includes(v.family)))throw Error('Invalid general distribution model');
  if('pipetteHalf'in v&&(v.pipetteHalf<0||v.pipetteHalf>=v.pipette||v.flaskHalf<0||v.flaskHalf>=v.flask||v.signalSd<0))throw Error('Invalid dilution uncertainty bounds');
  return v;
}
export interface ExperimentTrace {label:string;points:readonly {x:number;y:number}[];style:'line'|'bars'|'points'|'area'|'trajectory';emphasis?:'reference';}
export interface ExperimentPanel {xLabel:string;yLabel:string;traces:ExperimentTrace[];yDomain?:readonly [number,number];xDomain?:readonly [number,number];xLabels?:readonly {value:number;label:string}[];markers?:readonly {x:number;label:string}[];labelPoints?:boolean;hideYAxis?:boolean;inset?:ExperimentPanel;}
export interface ExperimentResult {panels:ExperimentPanel[];readouts:{label:string;value:number|string}[];note:string;}
const curve=(label:string,f:(x:number)=>number,lo:number,hi:number):ExperimentTrace=>({label,style:'line',points:Array.from({length:161},(_,i)=>{const x=lo+(hi-lo)*i/160;return{x,y:f(x)};})});
function histogram(label:string,values:readonly number[],lo?:number,hi?:number):{trace:ExperimentTrace;outside:number} {
  lo=lo??Math.min(...values);hi=hi??Math.max(...values);if(hi<=lo){lo-=.5;hi+=.5;}const width=(hi-lo)/32,counts=Array(32).fill(0);let outside=0;
  for(const x of values){if(x<lo||x>hi)outside++;else counts[Math.min(31,Math.floor((x-lo)/width))]++;}
  return{trace:{label,style:'bars',points:counts.map((count,i)=>({x:lo!+(i+.5)*width,y:count/values.length/width}))},outside};
}
export function runExperiment(b:ExperimentBlock,overrides:Readonly<Record<string,number>>={}):ExperimentResult {
  const p=parameterValues(b,overrides),r:ExperimentResult={panels:[],readouts:[],note:''};const add=(label:string,value:number|string)=>r.readouts.push({label,value});
  const panel=(xLabel:string,yLabel:string,traces:ExperimentTrace[])=>r.panels.push({xLabel,yLabel,traces});
  const uniform=seededUniform(p.seed??1),normal=()=>normalQuantile(uniform());
  switch(b.experimentKind){
    case 'distribution':{
      // Two explicit absolutely continuous models demonstrate that PDF/CDF are
      // general tools. Both parameterizations retain the same location and SD.
      const a=p.location-Math.sqrt(3)*p.scale,bound=p.location+Math.sqrt(3)*p.scale;
      const density=(x:number)=>p.family?(x>=a&&x<=bound?1/(bound-a):0):normalPdf((x-p.location)/p.scale)/p.scale;
      const cdf=(x:number)=>p.family?Math.max(0,Math.min(1,(x-a)/(bound-a))):normalCdf((x-p.location)/p.scale);
      const inverse=(probability:number)=>p.family?a+(bound-a)*probability:p.location+p.scale*normalQuantile(probability);
      const q=inverse(p.probability),threshold=p.view===2?q:p.threshold,lo=Math.min(p.location-4.5*p.scale,threshold-p.width),hi=Math.max(p.location+4.5*p.scale,threshold+p.width),left=threshold-p.width,right=threshold+p.width;
      const densityTrace=p.family?{label:'Assumed bounded flat density f',style:'line' as const,points:[{x:lo,y:0},{x:a,y:0},{x:a,y:density(a)},{x:bound,y:density(bound)},{x:bound,y:0},{x:hi,y:0}]}:curve('Assumed smooth density f',density,lo,hi);
      const areaLo=p.view===0?left:lo,areaHi=p.view===0?right:threshold;
      const shaded=p.family?{label:'Selected probability area',style:'area' as const,points:[{x:Math.max(a,Math.min(bound,areaLo)),y:density(a)},{x:Math.max(a,Math.min(bound,areaHi)),y:density(a)}]}:{...curve('Selected probability area',density,areaLo,areaHi),style:'area' as const};
      if(p.view===0){const samples=Array.from({length:p.M},()=>inverse(uniform())),h=histogram('Simulated histogram: empirical density',samples,lo,hi);panel('Nitrate result (mg/L)','Density (L/mg)',[h.trace,densityTrace,shaded]);r.panels[0].markers=[{x:left,label:'Lower interval bound'},{x:right,label:'Upper interval bound'}];add('Simulated results, not new measurements',p.M);add('Lower bound (mg/L)',left);add('Upper bound (mg/L)',right);add('Model interval probability',cdf(right)-cdf(left));add('Empirical interval fraction',samples.filter(v=>v>=left&&v<=right).length/p.M);r.note='Histogram bars describe a finite simulated sample; f describes an assumed population model, not a fitted conclusion. Narrow the interval: its area shrinks even where the density is high. A finer histogram needs enough observations, not merely narrower bins.';}
      else{panel('Same threshold x (mg/L)','Density f: left area',[densityTrace,shaded]);panel('Same threshold x (mg/L)','Cumulative probability F',[curve('Accumulated model probability F',cdf,lo,hi),{label:'Same threshold, accumulated area',style:'points',points:[{x:threshold,y:cdf(threshold)}]}]);r.panels[0].markers=[{x:threshold,label:'Shared threshold'}];r.panels[1].markers=[{x:threshold,label:'Shared threshold'}];r.panels[1].yDomain=[0,1];add('Shared threshold (mg/L)',threshold);add('Accumulated probability F(x)',cdf(threshold));add('Density f(x), not probability',density(threshold));add('Chosen cumulative probability p',p.probability);add('Inverse-CDF threshold (mg/L)',q);r.note='PDF area equals the CDF ordinate. Density is a rate of accumulation, not a point probability.';}
      break;
    }
    case 'ecdf':{
      const values=Array.from({length:p.M},()=>p.mu+p.sigma*normal()).sort((a,b)=>a-b),lo=Math.min(values[0],p.mu-4*p.sigma),hi=Math.max(values.at(-1)!,p.mu+4*p.sigma),points=[{x:lo,y:0}];
      values.forEach((x,i)=>points.push({x,y:i/p.M},{x,y:(i+1)/p.M}));points.push({x:hi,y:1});
      panel('Individual nitrate result (mg/L)','Cumulative fraction / model probability',[{label:'Empirical step CDF',style:'line',points},curve('Fixed assumed normal CDF',x=>normalCdf((x-p.mu)/p.sigma),lo,hi)]);
      add('Results in same seeded prefix',p.M);add('Empirical fraction at threshold',values.filter(x=>x<=p.threshold).length/p.M);add('Full-model probability at threshold',normalCdf((p.threshold-p.mu)/p.sigma));add('Threshold (mg/L)',p.threshold);
      add('Observed count at threshold',`${values.filter(x=>x<=p.threshold).length}/${p.M}`);
      r.note='The empirical curve includes observations equal to the threshold. Increase the prefix length without changing the generating model. A smaller visual discrepancy is not proof of normality; this is an assumed generator, not a fitted-model test.';break;
    }
    case 'signed': {
      const n=p.n,mass=Array.from({length:n+1},(_,k)=>Math.exp(logChoose(n,k)-n*Math.log(2))),spacing=2/Math.sqrt(n);
      panel('Standardized total error (SD units)','Probability mass / grid spacing',[{label:`${n} independent fair contributions`,style:'bars',points:mass.map((y,k)=>({x:(2*k-n)/Math.sqrt(n),y:y/spacing}))},...(p.overlay?[curve('Normal reference density',normalPdf,-4,4)]:[])]);
      if(p.comparisonN){const m=p.comparisonN,d=2/Math.sqrt(m);r.panels[0].traces.unshift({label:`Comparison: ${m} contributions`,style:'points',points:Array.from({length:m+1},(_,k)=>({x:(2*k-m)/Math.sqrt(m),y:Math.exp(logChoose(m,k)-m*Math.log(2))/d}))});r.panels[0].xDomain=[-4.5,4.5];add('Probability outside displayed window',mass.reduce((s,v,k)=>s+(Math.abs((2*k-n)/Math.sqrt(n))>4.5?v:0),0));}
      add('Independent contributions',n);add('Individual step (mg/L)',p.sigma/Math.sqrt(n));add('Total SD held fixed (mg/L)',p.sigma);add('Total probability',mass.reduce((a,b)=>a+b,0));add('Grid spacing (SD units)',spacing);
      r.note='Exact finite discrete law, not continuous observations. Heights divide masses by grid spacing so bar areas represent probability. The optional normal curve is a limit reference, not a claim of exact normality.';break;
    }
    case 'normal': case 'lognormal': {
      const log=b.experimentKind==='lognormal',center=log?p.reference:p.mu,spread=log?p.logSd:p.sigma;
      const threshold=p.inverse?(log?center*Math.exp(spread*normalQuantile(1-p.alpha)):center+spread*normalQuantile(1-p.alpha)):p.threshold;
      if(log&&threshold<=0)throw Error('Lognormal threshold must be positive');
      const eta=log?Math.log(threshold/center)/spread:(threshold-center)/spread,cdf=normalCdf(eta),lo=log?center*Math.exp(-3.8*spread):center-4*spread,hi=log?center*Math.exp(3.8*spread):center+4*spread;
      const density=(x:number)=>log?normalPdf(Math.log(x/center)/spread)/(x*spread):normalPdf((x-center)/spread)/spread;
      const cumulative=(x:number)=>normalCdf(log?Math.log(x/center)/spread:(x-center)/spread);
      const tail=curve('Upper-tail area in the drawing',density,Math.max(lo,Math.min(hi,threshold)),hi);
      panel(log?'Concentration (ng/L)':'Concentration (mg/L)',log?'Density (L/ng)':'Density (L/mg)',[curve(log?'Lognormal density':'Normal density',density,lo,hi),{...tail,style:'area'},{label:'Chosen threshold',style:'points',points:[{x:threshold,y:density(threshold)}]},...(log?[{label:'Mode, median and arithmetic expectation (left to right)',style:'points' as const,points:[center*Math.exp(-spread*spread),center,center*Math.exp(spread*spread/2)].map(x=>({x,y:density(x)}))}]:[])]);
      panel(log?'Concentration (ng/L)':'Concentration (mg/L)','Cumulative probability',[curve('CDF',cumulative,lo,hi),{label:'Same threshold and left probability',style:'points',points:[{x:threshold,y:cdf}]}]);
      add('Threshold',threshold);add('Standardized distance',eta);add('Standard-normal density at distance',normalPdf(eta));add('Left probability',cdf);add('Upper probability',normalCdf(-eta));
      if(log){add('Median',center);add('Arithmetic expectation',center*Math.exp(spread*spread/2));add('Mode',center*Math.exp(-spread*spread));}
      const mark=(x:number,label:string)=>({x,label});
      r.panels[0].markers=[mark(threshold,p.inverse?'Selected quantile':'Observed threshold')];
      if(!log&&p.view===1){const left=curve('Left cumulative area',density,lo,Math.max(lo,Math.min(hi,threshold)));r.panels[0].traces.splice(1,0,{...left,style:'area'});}
      if(!log&&p.view===2)r.panels.splice(1);
      if(!log&&p.view===4){
        const sd=p.comparisonSigma;
        r.panels=[{xLabel:'Same nitrate result (mg/L)',yLabel:'Density (L/mg)',traces:[curve(`Device A: known SD ${spread}`,density,center-4*sd,center+4*sd),curve(`Device B: known SD ${sd}`,x=>normalPdf((x-center)/sd)/sd,center-4*sd,center+4*sd)],markers:[mark(threshold,'Same result for both devices')]}];
        r.readouts=r.readouts.filter(v=>['Threshold','Standardized distance'].includes(v.label));add('Device B standardized distance',(threshold-center)/sd);
      }
      if(!log&&p.view===3){
        const low=center-p.band*spread,high=center+p.band*spread;
        r.panels[1]={xLabel:'Same concentration axis (mg/L)',yLabel:`Two tails outside ${p.band} SD`,traces:[curve('Normal density',density,lo,hi),{...curve('Lower tail',density,lo,low),style:'area'},{...curve('Upper tail',density,high,hi),style:'area'}],markers:[mark(low,'Lower bound'),mark(high,'Upper bound')]};
        add('Central coverage',2*normalCdf(p.band)-1);add('Total outside both bounds',2*(1-normalCdf(p.band)));
      }
      if(log&&p.view===1){
        r.panels[1]={xLabel:'Concentration after exponentiation (ng/L)',yLabel:'Lognormal concentration density',traces:[curve('Exponentiated concentration',density,lo,hi)],markers:[mark(center,'Concentration median')]};r.panels[0]={xLabel:'Dimensionless natural log ratio',yLabel:'Normal log-ratio density',traces:[curve('Normal log ratio before exponentiation',x=>normalPdf(x/spread)/spread,-3.8*spread,3.8*spread)],markers:[mark(0,'Log median: zero')]};
        r.readouts=r.readouts.filter(v=>v.label==='Median');add('Dimensionless log SD',spread);
      }
      if(log&&p.view===2){
        const mode=center*Math.exp(-spread*spread),expectation=center*Math.exp(spread*spread/2),padding=Math.max((expectation-mode)*.8,center*.05);
        r.panels.splice(1);r.panels[0].traces=[curve('Full concentration density',density,lo,hi)];
        r.readouts=r.readouts.filter(v=>['Median','Arithmetic expectation','Mode'].includes(v.label));
        r.panels[0].markers=[mark(center*Math.exp(-spread*spread),'Mode'),mark(center,'Median'),mark(center*Math.exp(spread*spread/2),'Arithmetic mean')];
        r.panels[0].inset={xLabel:'Center detail (ng/L)',yLabel:'Density',traces:[curve('Magnified centers, same density',density,Math.max(lo,mode-padding),expectation+padding)],markers:r.panels[0].markers};
      }
      if(log&&p.view===3){
        const q=center*Math.exp(spread*normalQuantile(1-p.alpha));
        r.panels[1]={xLabel:'Concentration (ng/L)',yLabel:'Inverse question: selected upper-tail rate',traces:[curve('Same lognormal density',density,lo,hi),{...curve('Selected upper-tail area',density,q,hi),style:'area'}],markers:[mark(q,'Inverse threshold')]};
        add('Inverse threshold for selected rate',q);add('Selected upper-tail rate',p.alpha);
      }
      r.note='Density height is not a probability. Probabilities use the full law, not the truncated drawing. Parameters are assumed, not estimated from the displayed examples.';
      if(log&&p.view===1)r.note+=' Exponentiation maps dimensionless normal log ratios to positive concentrations. Density heights on the two scales are not directly comparable.';
      else if(log&&p.view===2)r.note+=' The main graph retains the right tail. The inset magnifies the three centers without changing the model.';
      else if(log&&p.view===3)r.note+=' Left: a probability for the observed threshold. Right: a different threshold for a selected upper-tail rate under the same model.';
      else if(!log&&p.view===3)r.note+=' A one-sided upper rate and the total outside a symmetric band are different events.';
      else if(!log&&p.view===4)r.note+=' Both known-parameter models use the same observed concentration, not the later estimated device SDs.';
      else r.note+=' Inverse mode selects an upper-tail rate before inspecting data.';
      if(!log&&p.view===5){r.panels=[{xLabel:'Concentration (mg/L)',yLabel:'Normal density (L/mg)',traces:[curve('Assumed normal density',density,lo,hi)],markers:[mark(threshold,'Observed result')]}];r.readouts=r.readouts.filter(v=>['Threshold','Standardized distance'].includes(v.label));r.note='Subtract the model expectation, then divide by its known SD. The result is dimensionless. How often would such a departure occur? That probability question remains open.';}
      if(!log&&p.view===2)r.readouts=r.readouts.filter(v=>v.label!=='Standard-normal density at distance');break;
    }
    case 'means':{
      const lo=p.mu-4*p.sigma,hi=p.mu+4*p.sigma,se=p.sigma/Math.sqrt(p.n);
      panel('Concentration (mg/L)','Density (L/mg)',[curve('Individual results',x=>normalPdf((x-p.mu)/p.sigma)/p.sigma,lo,hi),curve(`Means of ${p.n} independent results`,x=>normalPdf((x-p.mu)/se)/se,lo,hi)]);
      if(p.comparisonN){const other=p.sigma/Math.sqrt(p.comparisonN);r.panels[0].traces.push(curve(`Means of ${p.comparisonN} results`,x=>normalPdf((x-p.mu)/other)/other,lo,hi));add('Comparison standard error (mg/L)',other);}
      add('Individual SD (mg/L)',p.sigma);add('SD of the mean (mg/L)',se);add('Measurements per mean',p.n);r.note='Same concentration axis and expectation. Independence and common variance supply the variance reduction; exact normal sampling distributions additionally assume normal individual results. Averaging does not remove a constant bias.';break;
    }
    case 'factors':{
      const values=[p.start];for(let i=0;i<p.steps;i++){const previous=values.at(-1)!;values.push(p.mode===0?previous+(i%2?-p.delta:p.delta):previous*(p.mode===2&&i%2?1/p.factor:p.factor));}
      if(values.some(v=>v<=0))throw Error('The log-ratio view requires positive concentrations');
      panel('Step','Concentration (ng/L)',[{label:'Same concentration trajectory',style:'trajectory',points:values.map((y,x)=>({x,y}))}]);panel('Step','Dimensionless natural log ratio to starting value',[{label:'Transformed same values',style:'trajectory',points:values.map((y,x)=>({x,y:Math.log(y/p.start)}))}]);
      for(const graph of r.panels){const ys=graph.traces[0].points.map(v=>v.y),min=Math.min(...ys),max=Math.max(...ys),pad=Math.max((max-min)*.25,.05);graph.yDomain=[min-pad,max+pad];graph.labelPoints=true;}
      add('Starting concentration',p.start);add('Final concentration',values.at(-1)!);add('Final log ratio',Math.log(values.at(-1)!/p.start));r.note=`Mode 0 alternates absolute +${p.delta} and −${p.delta} ng/L; mode 1 repeats the chosen relative factor; mode 2 alternates that factor and its reciprocal. Relative effects are not literal unbounded physical recovery fractions.`;break;
    }
    case 'squares':case 'variance':case 'student':case 'f-ratio':{
      const values:number[]=[],denominators:number[]=[];const samples=(n:number)=>Array.from({length:n},()=>normal());
      for(let j=0;j<p.M;j++){
        if(b.experimentKind==='squares')values.push(samples(p.df).reduce((s,x)=>s+x*x,0));
        else if(b.experimentKind==='variance')values.push(variance(samples(p.n))*p.sigma*p.sigma);
        else if(b.experimentKind==='student'){const a=samples(p.n),s=Math.sqrt(variance(a));values.push(mean(a)*Math.sqrt(p.n)/s);denominators.push(s);}
        else{const a=variance(samples(p.nA)),v=variance(samples(p.nB));values.push(p.reverse?a/v:v/a);}
      }
      if(b.experimentKind==='student'){
        const df=p.n-1,h=histogram('Repeated studentized means',values,-6,6);panel('Studentized mean departure','Density',[h.trace,curve('Student reference',x=>studentPdf(x,df),-6,6),curve('Hypothetical known-SD normal reference',normalPdf,-6,6)]);
        if(p.view===4){
          add('Measurements per simulated series',p.n);add('Degrees of freedom',df);
          if(p.comparisonN){const otherDf=p.comparisonN-1;r.panels[0].traces=[curve(`Student: ${df} df`,x=>studentPdf(x,df),-6,6),curve(`Student: ${otherDf} df`,x=>studentPdf(x,otherDf),-6,6),curve('Normal limit',normalPdf,-6,6)];add('Comparison degrees of freedom',otherDf);}
          r.note='Independent identically distributed normal measurement results make the sample mean and sample variance independent. Dividing a standardized mean by its own estimated SD factor produces the Student distribution. The true SD stays fixed; small estimated denominators produce heavier tails. Increasing degrees of freedom approaches the standard normal density. The finite drawing does not truncate the distribution.';
          break;
        }
        const t=p.departure/(p.observedSd/Math.sqrt(p.n)),critical=quantile(x=>studentCdf(x,df),.975,0,2);
        add('Observed statistic',t);add('Two-sided Student p',2*studentCdf(-Math.abs(t),df));add('Hypothetical normal p',2*normalCdf(-Math.abs(t)));add('97.5th percentile',critical);add('Residual degrees of freedom',df);add('Simulated ratios outside displayed window',h.outside);
        add('Smallest estimated SD / true SD',Math.min(...denominators));r.note='Normal sampling supplies independence of sample mean and variance. Each series estimates its own denominator. A small SD estimate can magnify a departure. Original CRM inference uses six results; changes of n are hypothetical design comparisons, not new observed data. Non-rejection does not prove no bias.';
        if(p.comparisonN){const otherDf=p.comparisonN-1,otherCritical=quantile(x=>studentCdf(x,otherDf),.975,0,2);r.panels[0].traces=[curve(`Student: ${df} df`,x=>studentPdf(x,df),-6,6),curve(`Student: ${otherDf} df`,x=>studentPdf(x,otherDf),-6,6),curve('Normal limit',normalPdf,-6,6)];r.panels[0].markers=[{x:critical,label:`${df} df critical`},{x:otherCritical,label:`${otherDf} df critical`}];add('Comparison 97.5th percentile',otherCritical);}
        if(p.view===2){r.panels[0].traces=[curve('Student null density',x=>studentPdf(x,df),-6,6),{...curve('Lower rejection area',x=>studentPdf(x,df),-6,-critical),style:'area'},{...curve('Upper rejection area',x=>studentPdf(x,df),critical,6),style:'area'}];r.panels[0].markers=[{x:-critical,label:'Lower 5% test bound'},{x:t,label:'Observed statistic'},{x:critical,label:'Upper 5% test bound'}];}
        if(p.view===3){const center=p.reference+p.departure,half=critical*p.observedSd/Math.sqrt(p.n);r.panels=[{xLabel:'Population mean concentration (mg/L)',yLabel:'Two-sided 95% confidence interval',hideYAxis:true,yDomain:[0,2],xDomain:[center-half*1.4,center+half*1.4],traces:[{label:'Mean confidence interval',style:'trajectory',points:[{x:center-half,y:1},{x:center+half,y:1}]},{label:'Observed sample mean',style:'points',points:[{x:center,y:1}]}],markers:[{x:p.reference,label:'CRM reference'},{x:center-half,label:'Lower CI'},{x:center+half,label:'Upper CI'}]}];add('Lower mean confidence limit (mg/L)',center-half);add('Upper mean confidence limit (mg/L)',center+half);add('CRM reference inside interval',p.reference>=center-half&&p.reference<=center+half?'Yes: do not reject':'No: reject');r.note='The fixed CRM reference is compared with the same two-sided 5% test. In repeated iid normal studies, 95% of intervals made by this procedure cover the fixed true mean. This is not a probability assigned to the mean after this interval is observed, nor a range for individual readings. Reference uncertainty is negligible only in this teaching example.';}
        if(!p.view||p.view===1)r.readouts=r.readouts.filter(v=>!['Observed statistic','Two-sided Student p','Hypothetical normal p'].includes(v.label));
        else r.readouts=r.readouts.filter(v=>!['Smallest estimated SD / true SD','Simulated ratios outside displayed window'].includes(v.label));
      }else if(b.experimentKind==='f-ratio'){
        if(p.view===3){
          const d1=(p.reverse?p.nA:p.nB)-1,d2=(p.reverse?p.nB:p.nA)-1,h=histogram('Independent variance ratios under equal true variances',values,0,15);
          panel('Ratio of independent sample variances','Density',[h.trace,curve('F density',x=>fPdf(x,d1,d2),.01,15)]);
          add('Numerator df',d1);add('Denominator df',d2);add('Simulated complete pairs',p.M);
          r.note='Independent normal samples with equal true variances produce this sample-variance ratio. More generally, divide each variance by its own true variance before forming the ratio. Equality of means is not required. Reversing the ratio swaps numerator and denominator degrees of freedom. The positive support extends to infinity; the drawing shows a finite window.';
          break;
        }
        const d1=(p.reverse?p.nA:p.nB)-1,d2=(p.reverse?p.nB:p.nA)-1,ratio=p.reverse?1/p.ratio:p.ratio,h=histogram('Independent variance ratios under equal true variances',values,0,15),cdf=(x:number)=>fCdf(x,d1,d2);
        panel('Prespecified variance ratio','Density',[h.trace,curve('F reference',x=>fPdf(x,d1,d2),.01,15)]);
        add('Observed ratio',ratio);add('Numerator df',d1);add('Denominator df',d2);add('Lower equal-tail bound',quantile(cdf,p.alpha/2));add('Upper equal-tail bound',quantile(cdf,1-p.alpha/2));add('Two-sided p',Math.min(1,2*Math.min(cdf(ratio),fCdf(1/ratio,d2,d1))));add('Simulated ratios outside displayed window',h.outside);
        r.note='Groups are independent normal samples. Equality of means is not required. Reverse explicitly changes the ratio to its reciprocal and swaps the ordered df, never sorting by observed variance. Alpha is chosen before data; changing it here is a sensitivity demonstration, not post-hoc selection.';
        if(p.view===2){const lower=quantile(cdf,p.alpha/2),upper=quantile(cdf,1-p.alpha/2),right=Math.max(15,upper*1.1,ratio*1.1),left=Math.min(.001,lower/10);r.panels[0].markers=[{x:lower,label:'Lower equal-tail bound'},{x:upper,label:'Upper equal-tail bound'},{x:ratio,label:'Observed ratio'}];r.panels[0].traces[1]=curve('F reference',x=>fPdf(x,d1,d2),left,right);r.panels[0].traces.push({...curve('Lower rejection tail',x=>fPdf(x,d1,d2),left,lower),style:'area'},{...curve('Upper rejection tail',x=>fPdf(x,d1,d2),upper,right),style:'area'});}
        else r.readouts=r.readouts.filter(v=>!['Observed ratio','Two-sided p','Lower equal-tail bound','Upper equal-tail bound'].includes(v.label));
      }else if(b.experimentKind==='variance'){
        const h=histogram('Sample variances from complete repeated series',values),df=p.n-1;panel('Sample variance ((mg/L) squared)','Density per squared concentration',[h.trace]);add('Complete series',p.M);add('Measurements per series',p.n);add('Mean estimated variance',mean(values));add('Relative SD of variance estimates',Math.sqrt(variance(values))/mean(values));add('Theoretical relative SD',Math.sqrt(2/df));add('Observed variance',p.observed);add('Simulated fraction at least observed',values.filter(v=>v>=p.observed).length/values.length);r.note='True method SD stays fixed. More simulated series improve the picture; more measurements per series improve the precision estimate. These are unscaled variance estimates, not chi-square Q. All simulated series remain counted.';
        if(b.data)r.panels[0].markers=b.data.map(d=>({x:d.x,label:d.label}));
        if(p.comparisonN){const other=Array.from({length:p.M},()=>variance(samples(p.comparisonN))*p.sigma*p.sigma),hi=Math.max(...values,...other);r.panels[0].traces=[histogram(`${p.n} measurements per series`,values,0,hi).trace,histogram(`${p.comparisonN} measurements per series`,other,0,hi).trace];add('Comparison measurements per series',p.comparisonN);add('Comparison theoretical relative SD',Math.sqrt(2/(p.comparisonN-1)));}
      }else{
        const h=histogram('Sums of independent squared standard normals',values);panel('Sum of independent squared distances','Density',[h.trace,curve('Chi-square reference',x=>chiPdf(x,p.df),.02,Math.max(...values))]);add('Independent squared components',p.df);add('Mean simulated sum',mean(values));add('Theoretical mean',p.df);r.note='Signs disappear on squaring. Add independent standard-normal squares, not arbitrary correlated residuals. A one-component density is unbounded near zero; the drawing starts at a positive coordinate and does not assert a finite value at zero.';
      }break;
    }
    case 'dilution':{
      const out:number[]=[],signalOnly:number[]=[],volumesOnly:number[]=[];let first:number[]=[];
      for(let i=0;i<p.M;i++){const u=[uniform(),uniform(),uniform()],randomA=p.signal+p.signalSd*normalQuantile(u[0]),randomVp=p.pipette+p.pipetteHalf*(2*u[1]-1),randomVf=p.flask+p.flaskHalf*(2*u[2]-1),a=p.source===2?p.signal:randomA,vp=p.source===1?p.pipette:randomVp,vf=p.source===1?p.flask:randomVf,c=(a-p.intercept)*vf/(p.slope*vp);out.push(c);signalOnly.push((randomA-p.intercept)*p.flask/(p.slope*p.pipette));volumesOnly.push((p.signal-p.intercept)*randomVf/(p.slope*randomVp));if(!i)first=[...u,a,vp,vf,c];}
      if(p.M===1)panel('Trial index','Collected-sample concentration (mg/L)',[{label:'One propagated result, not an output distribution',style:'points',points:[{x:1,y:out[0]}]}]);
      else{panel('Collected-sample concentration (mg/L)','Simulated density (L/mg)',[histogram('Propagated assumed input uncertainty',out).trace]);r.panels[0].markers=[{x:empiricalQuantile(out,.025),label:'2.5% quantile'},{x:(p.signal-p.intercept)*p.flask/(p.slope*p.pipette),label:'Nominal concentration'},{x:empiricalQuantile(out,.975),label:'97.5% quantile'}];}
      add('Trials retained',p.M);add('Nominal result (mg/L)',(p.signal-p.intercept)*p.flask/(p.slope*p.pipette));add('Mean (mg/L)',mean(out));add('Median (mg/L)',empiricalQuantile(out,.5));add('Output SD (mg/L)',out.length>1?Math.sqrt(variance(out)):'Not estimated from one trial');add('Central lower 95% (mg/L)',empiricalQuantile(out,.025));add('Central upper 95% (mg/L)',empiricalQuantile(out,.975));
      ['First uniform: signal','First uniform: pipette','First uniform: flask','First absorbance','First pipette volume (mL)','First flask volume (mL)','First result (mg/L)'].forEach((label,i)=>add(label,first[i]));
      if(p.M>1){add('Absorbance-only output SD (mg/L)',Math.sqrt(variance(signalOnly)));add('Volumes-only output SD (mg/L)',Math.sqrt(variance(volumesOnly)));}
      r.note='Source 0: all three uncertainties; source 1: absorbance only; source 2: volumes only. All three uniforms are consumed in every mode for comparable seeded trials. Calibration slope and intercept are fixed. This propagates assumed input models, not empirical laboratory validation. The central output interval is not automatically a confidence interval for the true sample mean. More trials reduce numerical Monte Carlo error, not physical uncertainty.';break;
    }
    case 'calibration':{
      const data=b.data!,x=data.map(d=>d.x),y=data.map(d=>d.y),simple=fitPolynomial(x,y,1),complex=fitPolynomial(x,y,2),evaluate=(a:number[],v:number)=>a.reduce((s,c,i)=>s+c*v**i,0),rs=y.map((v,i)=>v-evaluate(simple,x[i])),rc=y.map((v,i)=>v-evaluate(complex,x[i])),rssS=rs.reduce((s,v)=>s+v*v,0),rssC=rc.reduce((s,v)=>s+v*v,0),df=x.length-3,f=(rssS-rssC)/(rssC/df);
      panel('Calibration concentration (mg/L)','Response',[{label:'Same authored calibration observations',style:'points',points:data.map(d=>({x:d.x,y:d.y}))},curve('Linear fit',v=>evaluate(simple,v),Math.min(...x),Math.max(...x)),...(p.showQuadratic?[curve('Quadratic fit',v=>evaluate(complex,v),Math.min(...x),Math.max(...x))]:[])]);
      panel('Calibration concentration (mg/L)','Residual response',[{label:'Linear residuals',style:'points',points:rs.map((v,i)=>({x:x[i],y:v}))},...(p.showQuadratic?[{label:'Quadratic residuals',style:'points' as const,points:rc.map((v,i)=>({x:x[i],y:v}))}]:[])]);
      const residualLimit=Math.max(...rs.map(Math.abs),...rc.map(Math.abs))*1.15;r.panels[1].yDomain=[-residualLimit,residualLimit];
      if(p.view===1||p.view===2)r.panels.splice(0,1);
      add('Linear residual sum of squares',rssS);add('Quadratic residual sum of squares',rssC);add('Added-term sum of squares',rssS-rssC);add('Numerator df',1);add('Denominator df',df);add('Nested-model F',f);add('Upper-tail reference p',1-fCdf(f,1,df));r.note='Same fixed observations, full-rank nested designs, intercept counted in both models. The two RSS values are dependent. Under the added-coefficient null and independent homoscedastic normal errors, added-term SS and complex-model residual SS are the independent quadratic forms. Constructed data illustrate calculation, not validation.';
      if(p.view===1){r.readouts=r.readouts.filter(v=>v.label==='Linear residual sum of squares');r.note='Inspect the ordered linear-model residuals before fitting an additional term. A systematic bend motivates a nested-model comparison; a lower RSS alone is guaranteed and is not sufficient evidence. These constructed observations illustrate calculation, not validation of normal, independent equal-variance errors.';}
      if(p.view===2){r.readouts=r.readouts.filter(v=>v.label.includes('sum of squares'));r.note='Same twelve observations, common residual axis. Does the systematic bend shrink after adding one coefficient? Compare RSS before interpreting a test. A smaller RSS alone does not establish a useful or valid model.';}break;
    }
    case 'stress':{
      const a=Array.from({length:p.n},()=>p.mu+p.sigma*normal()),v=Array.from({length:p.n},()=>p.mu+p.sigma*normal());if(p.mode===1)v[v.length-1]+=p.outlierShift;if(p.mode===2)v.forEach((_,i)=>{v[i]+=p.drift*i/(v.length-1);});const ratio=variance(v)/variance(a);
      panel('Acquisition order','Result (mg/L)',[{label:'Independent group A',style:'trajectory',points:a.map((y,x)=>({x:x+1,y}))},{label:`Group B: ${['stable','one added outlier','acquisition-order drift'][p.mode]}`,style:'trajectory',points:v.map((y,x)=>({x:x+1,y}))}]);
      // Undo only the selected stress to recover the shared baseline, then bound
      // every available mode. Toggling modes must not change the visual scale.
      const baseline=v.map((y,i)=>y-(p.mode===1&&i===v.length-1?p.outlierShift:0)-(p.mode===2?p.drift*i/(v.length-1):0));
      const all=[...a,...baseline,...baseline.map((y,i)=>y+(i===baseline.length-1?p.outlierShift:0)),...baseline.map((y,i)=>y+p.drift*i/(baseline.length-1))];
      const lower=Math.min(...all),upper=Math.max(...all),padding=(upper-lower)*.08;
      r.panels[0].yDomain=[lower-padding,upper+padding];
      add('A mean',mean(a));add('B mean',mean(v));add('A sample SD',Math.sqrt(variance(a)));add('B sample SD',Math.sqrt(variance(v)));add('B/A sample variance ratio',ratio);add('Nominal two-sided F p',Math.min(1,2*Math.min(fCdf(ratio,p.n-1,p.n-1),1-fCdf(ratio,p.n-1,p.n-1))));r.note='Mode 0 stable, mode 1 one outlier, mode 2 drift in acquisition order. All three modes share one concentration window covering every value in these comparisons. One realization demonstrates sensitivity, not a measured false-positive rate. The usual reference p is only nominal when its model is violated. Pairing, Welch, robust variance comparisons and dependence-aware methods answer distinct design questions.';
      if(p.view===1){r.readouts=r.readouts.filter(v=>!v.label.includes('ratio')&&!v.label.includes(' p'));r.note='Compare stable acquisition, one added outlier and gradual drift on the same concentration axis. Inspect order before pooling observations. These constructed examples question stable independent normal sampling; they do not diagnose a cause or establish a population law.';}break;
    }
    case 'pearson':{
      const rows=b.data!,observed=rows.map(d=>p.mode?d.z!:d.y),expected=rows.map(d=>d.x);if(observed.some(v=>!Number.isFinite(v))||expected.some(v=>v<=0))throw Error('Pearson needs positive expected counts and both authored alternatives');const contributions=observed.map((v,i)=>(v-expected[i])**2/expected[i]),q=contributions.reduce((a,b)=>a+b,0),df=rows.length-1;
      panel('Particle diameter category','Particle count',[{label:'Observed',style:'bars',points:observed.map((y,x)=>({x:x+1,y}))},{label:'Expected',style:'points',emphasis:'reference',points:expected.map((y,x)=>({x:x+1,y}))}]);
      if(p.view===1)r.panels[0].traces=[{label:'Weighted discrepancies, summed for the test',style:'bars',points:contributions.map((y,x)=>({x:x+1,y}))}];
      r.panels[0].xDomain=[.5,rows.length+.5];r.panels[0].xLabels=rows.map((d,i)=>({value:i+1,label:d.label}));
      if(p.view===1)r.panels[0].yLabel='Contribution to Pearson statistic';
      const cutoff=quantile(x=>1-gammaQ(df/2,x/2),.95);
      add('Pearson statistic',q);add('Degrees of freedom',df);add('Upper-tail reference p',gammaQ(df/2,q/2));add('Prespecified upper 5% cutoff',cutoff);add('Decision',q>cutoff?'Reject the stated proportions':'Do not reject the stated proportions');add('Interpretation',q>cutoff?'Counts differ significantly from stated proportions (5% level)':'No significant departure from stated proportions (5% level)');contributions.forEach((v,i)=>add(rows[i].label+' contribution',v));r.note='Independent classifications, fixed exhaustive categories and probabilities, no fitted parameters, adequate expected counts. This chi-square approximation for categorical counts is not the exact normal-sample variance statistic. Non-rejection does not establish the model.';
      if(!p.view)r.readouts=[{label:'Observed classifications retained',value:observed.reduce((a,b)=>a+b,0)},{label:'Total expected count',value:expected.reduce((a,b)=>a+b,0)}];break;
    }
  }
  return r;
}
function logChoose(n:number,k:number):number {let value=0;for(let i=1;i<=k;i++)value+=Math.log(n-i+1)-Math.log(i);return value;}
function fitPolynomial(x:number[],y:number[],degree:number):number[] {
  const n=degree+1,a=Array.from({length:n},(_,i)=>Array.from({length:n+1},(_,j)=>j<n?x.reduce((s,v)=>s+v**(i+j),0):x.reduce((s,v,k)=>s+y[k]*v**i,0)));
  for(let i=0;i<n;i++){let pivot=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;[a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i];if(Math.abs(d)<1e-12)throw Error('Calibration design is rank deficient');for(let k=i;k<=n;k++)a[i][k]/=d;for(let j=0;j<n;j++)if(j!==i){const q=a[j][i];for(let k=i;k<=n;k++)a[j][k]-=q*a[i][k];}}
  return a.map(row=>row[n]);
}
export function experimentFallback(b:ExperimentBlock):string {const r=runExperiment(b);return[b.label,b.description,...b.parameters.map(p=>`${p.label}: ${p.value}`),...r.readouts.map(v=>`${v.label}: ${v.value}`),r.note,...r.panels.flatMap(p=>[p.xLabel,p.yLabel,...(p.xLabels??[]).map(v=>`${v.value}: ${v.label}`),...(p.markers??[]).map(v=>`${v.label}: ${v.x}`),...p.traces.flatMap(t=>[t.label,...t.points.map(v=>`${v.x}: ${v.y}`)])])].join('\n');}
