import {createHash} from 'node:crypto';
import {validateThematicScript,resolveScriptMaterialNumbers,resolveScriptSectionFlow,type ThematicScript} from '../../core/src/thematic-script.ts';
import type {SceneBlock,MathematicalDerivationSection,DefinitionListEntry} from '../../core/src/scene-document.ts';
import {renderSymbolDefinitions} from '../../renderer-shared/src/symbol-definitions.ts';
import {runExperiment,type ExperimentPanel} from '../../core/src/distribution-experiment.ts';
import {histogramBlockBins,histogramCells,histogramBins} from '../../core/src/histogram.ts';
import {boxPlotSummary,sampleQuantile} from '../../core/src/box-plot.ts';
import {empiricalMoments} from '../../core/src/moments.ts';
import type {ObservationExplorerBlock} from '../../core/src/observation-explorer.ts';
import {empiricalSteps} from '../../core/src/empirical-distribution.ts';

export const latexLabel=(id:string)=>'material-'+createHash('sha256').update(id).digest('hex');
export function latexMediaFilename(block:Extract<SceneBlock,{kind:'media-reference'}>):string {
  if(block.mediaType!=='image/svg+xml'||!/^sha256-[a-f0-9]{64}$/u.test(block.integrity??''))throw new Error('LaTeX media requires a digest-bound local SVG');
  return 'asset-'+block.integrity!.slice(7)+'.pdf';
}
const EX='https://w3id.org/project-chemie-digital/resource/';
const expand=(id:string)=>id.startsWith('ex:')?EX+id.slice(3):id;
const glyphs:Record<string,string>={
  'ε':'\\varepsilon','κ':'\\kappa','δ':'\\delta','θ':'\\theta','λ':'\\lambda','ρ':'\\rho','Ω':'\\Omega',
  '∈':'\\in','ℝ':'\\mathbb{R}','ℤ':'\\mathbb{Z}','ℂ':'\\mathbb{C}','×':'\\times','³':'{}^3','≠':'\\ne','→':'\\to',
  '∑':'\\sum','∛':'\\sqrt[3]{\\vphantom{x}}','𝜇':'\\mu',
  '⁰':'{}^0','⁵':'{}^5','⁶':'{}^6','⁷':'{}^7','⁸':'{}^8','⁹':'{}^9','⁺':'{}^+',
  '₄':'{}_4','₆':'{}_6','₇':'{}_7','₈':'{}_8',
  'ₙ':'{}_n','ₘ':'{}_m','ₚ':'{}_p','ₛ':'{}_s','ₜ':'{}_t','ₓ':'{}_x',
  '₊':'{}_+','₋':'{}_-','γ':'\\gamma',
  'ₐ':'{}_a','ₑ':'{}_e','ₒ':'{}_o','ₕ':'{}_h','ₗ':'{}_l',
  'Γ':'\\Gamma','Σ':'\\Sigma','Φ':'\\Phi','α':'\\alpha','μ':'\\mu','ν':'\\nu','π':'\\pi','σ':'\\sigma','φ':'\\varphi','χ':'\\chi',
  '−':'-','√':'\\sqrt{\\vphantom{x}}','∞':'\\infty','∫':'\\int','∼':'\\sim','≈':'\\approx','≤':'\\le','≥':'\\ge','′':'\\prime',
  '²':'{}^2','¹':'{}^1','⁴':'{}^4','⁻':'{}^-','ᵃ':'{}^a','ᵗ':'{}^t','ᵘ':'{}^u','ᵢ':'{}_i','ⱼ':'{}_j',
  '₀':'{}_0','₁':'{}_1','₂':'{}_2','₃':'{}_3','₅':'{}_5','₉':'{}_9','ₖ':'{}_k','₍':'{}_{(}','₎':'{}_{)}','½':'\\tfrac12','·':'\\cdot','…':'\\ldots',
};
const special:Record<string,string>={'\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$','^':'\\textasciicircum{}','~':'\\textasciitilde{}'};
export function latexText(text:string):string {
  // Combining bars are authored symbol notation, not a font-dependent accent.
  const chars=[...text];let result='';
  for(let i=0;i<chars.length;i++){
    const c=chars[i]!;
    if(/[A-Za-z]/u.test(c)&&chars[i+1]==='\u0304'){result+=`\\ensuremath{\\bar{${c}}}`;i++;}
    else result+=special[c]??(glyphs[c]?`\\ensuremath{${glyphs[c]}}`:c);
  }
  return result;
}
const mathCommands=new Set(['! ',',',';','Gamma','Phi','approx','bar','begin','cdot','cdots','chi','end','exp','frac','ge','infty','int','le','left','ln','mathcal','mathrm','mu','nu','operatorname','pi','qquad','quad','right','sigma','sim','sqrt','sum','text','varphi','phi','alpha','beta','delta','epsilon','varepsilon','theta','lambda','rho','tau','gamma','Delta','Sigma','times','pm','in','to','underbrace','overline','vert','mid','Pr','tfrac','dfrac','mathbf','mathbb','hat','widehat','log','lvert','rvert','vec','substack','limits','neq','ne','leq','geq','dots','equiv']);
export function latexMath(expression:string):string {
  const additional=new Set(['prod','kappa','lceil','rceil','lfloor','rfloor','ldots','boxed','Longrightarrow','overset','phantom','textstyle','tilde','xrightarrow']);
  for(const match of expression.matchAll(/\\([A-Za-z]+|.)/gs)){
    if(!['\\',',',';','!','{','}','|',' ','%'].includes(match[1]!)&&!mathCommands.has(match[1]!)&&!additional.has(match[1]!))throw new Error(`Unsupported/unsafe math command: ${match[0]}`);
  }
  for(const match of expression.matchAll(/\\(?:begin|end)\{([^}]+)\}/g))if(!['gathered','aligned','matrix','pmatrix','cases'].includes(match[1]!))throw new Error('Unsupported mathematical environment');
  const unsafePercent=/(^|[^\\])(?:\\\\)*%/u.test(expression);
  if(expression.includes('^^')||unsafePercent||/[\u0000-\u0008\u000b\u000c\u000e-\u001f#]/u.test(expression))throw new Error('Unsafe mathematical source');
  // unicode-math's text-font \mathrm has no mathematical Greek glyphs in
  // Latin Modern Roman. Keep unit prefixes in the upright mathematical font.
  return expression.replace(/\\mathrm\{\\mu\s*([^{}]*)\}/gu,(_match,unit:string)=>`\\symup{\\mu}\\mathrm{${unit}}`);
}

/** Same explicit inline language as HTML; plain prose can never become TeX. */
export function latexInline(text:string,reference?:(id:string)=>string):string {
  const tokens=/`([^`\n]+)`|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\*\*([^*\n]+)\*\*|\[\[ref:([^\]]*)\]\]|(\*{5})/gu;
  let result='',end=0;
  for(const match of text.matchAll(tokens)){
    result+=latexText(text.slice(end,match.index));
    if(match[1]!==undefined)result+=`\\texttt{${latexText(match[1])}}`;
    else if(match[4]!==undefined)result+=`\\textbf{${latexInline(match[4],reference)}}`;
    else if(match[5]!==undefined){if(!reference)throw new Error('Unexpected reference outside script prose');result+=reference(expand(match[5]));}
    else if(match[6]!==undefined)result+='\\textbf{*}';
    else result+=`\\(${latexMath(match[2]??match[3]!)}\\)`;
    end=match.index!+match[0].length;
  }
  return result+latexText(text.slice(end));
}

function prose(text:string,reference?:(id:string)=>string):string {
  return text.split(/\n\s*\n/u).map(paragraph=>{
    const lines=paragraph.split('\n');
    if(lines.every(line=>line.trim().startsWith('- ')))return '\\begin{itemize}\\setlength{\\itemsep}{1pt}\\setlength{\\parsep}{0pt}\n'+lines.map(line=>'\\item '+latexInline(line.trim().slice(2),reference)).join('\n')+'\n\\end{itemize}';
    return latexInline(paragraph,reference);
  }).join('\n\n');
}
function num(value:number):string {if(!Number.isFinite(value))throw new Error('Nonfinite plot coordinate');return String(value);}
/** Match interactive readouts; round display only, never plotted/model values. */
export function formatExperimentValue(value:number|string):string {
  if(typeof value==='string')return value;
  if(!Number.isFinite(value))throw new Error('Nonfinite experiment readout');
  return Math.abs(value)<1e-4&&value!==0?value.toExponential(2):Number(value.toPrecision(4)).toString();
}
const color=(index:number)=>`pcd${index%5+1}`;
const axisText=(axis:{label:string;unit?:string})=>axis.unit&&!axis.label.includes(axis.unit)?`${axis.label} (${axis.unit})`:axis.label;
function plot(panel:ExperimentPanel,height='6.5cm',showLegend=true,barHalfWidth?:number):string {
  const options=['width=0.94\\linewidth',`height=${height}`,'scale only axis=false','grid=major',
    'tick label style={font=\\small}','label style={font=\\small}',
    `xlabel={${latexText(panel.xLabel)}}`,`ylabel={${latexText(panel.yLabel)}}`,
    'legend style={font=\\footnotesize,draw=none,at={(0.5,-0.28)},anchor=north,legend columns=1,text width=0.85\\linewidth,align=left}',
    'unbounded coords=jump','scaled ticks=false'];
  if(panel.yDomain)options.push(`ymin=${num(panel.yDomain[0])}`,`ymax=${num(panel.yDomain[1])}`);
  if(panel.xDomain)options.push(`xmin=${num(panel.xDomain[0])}`,`xmax=${num(panel.xDomain[1])}`);
  if(panel.hideYAxis)options.push('ytick=\\empty');
  if(panel.xLabels)options.push(`xtick={${panel.xLabels.map(p=>num(p.value)).join(',')}}`,
    `xticklabels={${panel.xLabels.map(p=>'{'+latexText(p.label)+'}').join(',')}}`);
  const traces=panel.traces.filter(trace=>trace.points.length).map((trace,index)=>{
    const coordinates=(points:readonly {x:number;y:number}[])=>points.map(p=>`(${num(p.x)},${num(p.y)})`).join(' ');
    const style=`color=${color(index)},thick,${trace.emphasis==='reference'?'dashed,':''}`;
    let drawing:string;
    if(trace.style==='bars'){
      const half=trace.points.length>1?Math.abs(trace.points[1]!.x-trace.points[0]!.x)/2:0.4;
      drawing=trace.points.map((point,i)=>{
        const h=barHalfWidth??(panel.xLabels?half*.8:half);
        return `\\addplot[${style}fill=${color(index)},fill opacity=0.35,${i?'forget plot,':''}mark=none] coordinates {(${num(point.x-h)},0) (${num(point.x-h)},${num(point.y)}) (${num(point.x+h)},${num(point.y)}) (${num(point.x+h)},0)} \\closedcycle;`;
      }).join('\n');
      // PGFPlots associates the legend with the first, non-forgotten bar.
    }else drawing=`\\addplot[${style}${trace.style==='points'?'only marks,mark=*':'mark=none'}${trace.style==='area'?`,fill=${color(index)},fill opacity=0.2`:''}] coordinates {${coordinates(trace.points)}}${trace.style==='area'?' \\closedcycle':''};`;
    return drawing+(showLegend?`\n\\addlegendentry{${latexText(trace.label)}}`:'');
  }).join('\n');
  const ys=panel.traces.flatMap(trace=>trace.points.map(point=>point.y));
  const markerBottom=panel.yDomain?.[0]??Math.min(0,...ys),markerTop=panel.yDomain?.[1]??Math.max(...ys)*1.05;
  const markers=(panel.markers??[]).map((marker,index)=>
    `\\addplot[color=${color(index+1)},dashed,thick${showLegend?'':',forget plot'}] coordinates {(${num(marker.x)},${num(markerBottom)}) (${num(marker.x)},${num(markerTop)})};`+
    (showLegend?`\n\\addlegendentry{${latexText(marker.label)}}`:'')).join('\n');
  return `\\begin{center}\n\\begin{tikzpicture}\n\\begin{axis}[${options.join(',\n')}]\n${traces}\n${markers}\n\\end{axis}\n\\end{tikzpicture}\n\\end{center}\n${panel.inset?plot(panel.inset,'5cm'):''}`;
}

function table(block:Extract<SceneBlock,{kind:'table'}>):string {
  const columns='@{}'+block.columns.map(()=>'p{\\dimexpr'+(1/block.columns.length).toFixed(6)+'\\linewidth-2\\tabcolsep\\relax}').join('')+'@{}';
  const row=(cells:readonly string[])=>cells.map(cell=>latexInline(cell)).join(' & ')+' \\\\ \\hline\n';
  return `\\begin{longtable}{${columns}}\n${row(block.columns.map(column=>column.label))}\\endhead\n${block.rows.map(item=>row(item.cells.map(cell=>cell.text))).join('')}\\end{longtable}`;
}

const displayMath=(expression:string)=>`\\begin{center}\\begin{adjustbox}{max width=\\linewidth}$\\displaystyle ${latexMath(expression)}$\\end{adjustbox}\\end{center}\n`;
function legendEntryLatex(entry:DefinitionListEntry):string {
  const body=entry.explanation??entry.description??'';
  if(renderSymbolDefinitions(body))return prose(body);
  return `\\par\\noindent\\textbf{${entry.expression?'\\('+latexMath(entry.expression)+'\\)':latexInline(entry.term)}} ${prose(body)}`;
}
/** Same point/box/histogram series, bins and contribution encodings as the shared
 * moment matrix. All coordinates derive from observations, never resource IDs. */
function momentMatrixLatex(block:ObservationExplorerBlock):string {
  const metric=block.momentMetric!,all=block.series.flatMap(s=>s.data.map(d=>d.value));
  let lo=Math.floor(Math.min(...all)/5)*5,hi=Math.ceil(Math.max(...all)/5)*5;
  if(lo===hi){lo-=1;hi+=1;}
  const edges=Array.from({length:17},(_,i)=>lo+(hi-lo)*i/16);
  const rows=block.series.map(s=>({s,m:empiricalMoments(s.data.map(d=>d.value)),q:boxPlotSummary(s.data.map(d=>d.value)),bins:histogramBins(s.data.map(d=>d.value),edges)}));
  const maxCount=Math.max(1,...rows.flatMap(r=>r.bins.map(b=>b.count)));
  const x=(v:number)=>42+(v-lo)/(hi-lo)*413;
  const line=(x1:number,y1:number,x2:number,y2:number,style='draw=pcd1')=>`\\draw[${style}] (${num(x1)},${num(y1)}) -- (${num(x2)},${num(y2)});`;
  const rect=(x1:number,y1:number,x2:number,y2:number,style:string)=>`\\path[${style}] (${num(x1)},${num(y1)}) rectangle (${num(x2)},${num(y2)});`;
  const text=(xx:number,yy:number,value:string,anchor='west',size=16)=>`\\node[anchor=${anchor},font=\\fontsize{${size}}{${size+3}}\\selectfont] at (${num(xx)},${num(yy)}) {${latexText(value)}};`;
  const circle=(xx:number,yy:number,r:number,fill:string)=>`\\fill[${fill},opacity=.72] (${num(xx)},${num(yy)}) circle[radius=${num(r)}pt];`;
  const drawing=rows.flatMap(({s,m,q,bins},row)=>[0,1,2].map(col=>{
    const value=metric==='mean'?m.mean:metric==='variance'?m.m2:m[metric];
    const stat=metric==='mean'?'mean':metric==='variance'?'m₂':metric==='kurtosis'?'K':'g₁';
    const units=metric==='mean'?' '+block.xAxis.unit:metric==='variance'?' ('+block.xAxis.unit+')²':'';
    const sd=Math.sqrt(m.m2),median=sampleQuantile(s.data.map(d=>d.value),.5);
    const power=metric==='kurtosis'?4:3,maxPower=Math.max(1,...s.data.map(d=>Math.abs(d.value-m.mean)**power));
    const parts=[`\\begin{scope}[shift={(${col*480},${40+row*180})}]`,rect(5,2,475,176,'draw=pcd1!45'),text(20,25,`${s.label} · ${stat} = ${value===null?'undefined':Number(value.toFixed(3))}${units}`)];
    if(metric==='variance'||metric==='kurtosis'){
      const k=metric==='variance'?1:2,left=x(Math.max(lo,m.mean-k*sd)),right=x(Math.min(hi,m.mean+k*sd));
      parts.push(rect(left,45,right,143,'fill=pcd1,fill opacity=.1'),line(left,45,left,143,'draw=pcd1,dashed'),line(right,45,right,143,'draw=pcd1,dashed'));
    }
    for(let tick=0;tick<=4;tick++){
      const v=lo+(hi-lo)*tick/4;
      parts.push(line(x(v),45,x(v),143,'draw=pcd1!15'),text(x(v),164,String(Number(v.toFixed(2))),'center',13));
    }
    if(col===0)for(const [i,d] of s.data.entries()){
      const radius=metric==='skewness'||metric==='kurtosis'?2+5*Math.abs(d.value-m.mean)**power/maxPower:2.7;
      const fill=metric==='skewness'?(d.value<m.mean?'pcd2':'pcd4'):metric==='kurtosis'&&Math.abs(d.value-m.mean)>2*sd?'pcd4':'pcd1';
      parts.push(circle(x(d.value),75+(i%7)*7,radius,fill));
    }
    if(col===1){
      parts.push(line(x(q.lowerWhisker),94,x(q.upperWhisker),94,'draw=black'),rect(x(q.lower),71,x(q.upper),117,'fill=pcd2,fill opacity=.25,draw=pcd2'),line(x(q.median),71,x(q.median),117,'draw=black,line width=2pt'));
      for(const v of [q.lowerWhisker,q.upperWhisker])parts.push(line(x(v),81,x(v),107,'draw=black'));
      for(const i of q.outlierIndices)parts.push(circle(x(s.data[i]!.value),94,3,'pcd4'));
    }
    if(col===2){
      for(const bin of bins)parts.push(rect(x(bin.lower),143-bin.count/maxCount*98,x(bin.upper),143,'fill=pcd1,fill opacity=.45,draw=pcd1'));
      for(const count of [0,Math.ceil(maxCount/2),maxCount])parts.push(text(36,143-count/maxCount*98,String(count),'east',12));
    }
    parts.push(line(42,143,455,143,'draw=black'),line(x(m.mean),45,x(m.mean),143,'draw=pcd1,line width=2pt'));
    if(metric==='skewness')parts.push(line(x(median),45,x(median),143,'draw=pcd2,dashed,line width=1.5pt'));
    parts.push('\\end{scope}');return parts.join('\n');
  })).join('\n');
  return '\\noindent Horizontal axes: '+latexText(axisText(block.xAxis))+'.\\par\n\\resizebox{\\linewidth}{!}{\\begin{tikzpicture}[x=1pt,y=-1pt]\n'+
    ['Points','Boxplot: linear interpolation, 1.5 IQR fences','Histogram: common bins'].map((label,i)=>text(i*480+240,24,label,'center')).join('\n')+'\n'+drawing+'\n\\end{tikzpicture}}\n';
}
function derivationLatex(section:MathematicalDerivationSection):string {
  return `\\paragraph{${latexInline(section.label)}}\n`+section.steps.map(step=>
    displayMath(step.from.expression)+`\\noindent\\textbf{${latexInline(step.operation)}} (${latexInline(step.kindLabel)})\\par\n`+
    prose(step.rule.description)+'\n'+displayMath(step.rule.formula.expression)+'\n'+
    prose(step.explanation.text)+'\n'+displayMath(step.explanation.application.expression)+'\n'+
    step.assumptions.map(a=>`\\par\\textbf{${latexInline(a.label)}} ${prose(a.description)}`).join('\n')+'\n'+
    displayMath(step.to.expression)).join('\n')+'\n\\paragraph{Symbols}\n'+
    section.legend.map(legendEntryLatex).join('\n');
}
function blockLatex(block:SceneBlock):string {
  switch(block.kind){
    case 'math':
      if(block.derivation)return derivationLatex(block.derivation)+(block.derivationDetails??[]).map(detail=>
        `\n\\subsubsection*{${latexInline(detail.label)}}\n`+detail.sections.map(derivationLatex).join('\n')).join('\n');
      return `\\begin{center}\\begin{adjustbox}{max width=\\linewidth}$\\displaystyle ${latexMath(block.expression)}$\\end{adjustbox}\\end{center}\n`;
    case 'definition-list':
      return block.entries.map(entry=>`\\par\\noindent\\textbf{${latexInline(entry.term)}}\n\n${prose(entry.explanation??entry.description??'')}\n`).join('\n');
    case 'table':return table(block);
    case 'media-reference':return `\\begin{center}\\includegraphics[width=\\linewidth,height=.62\\textheight,keepaspectratio]{${latexMediaFilename(block)}}\\end{center}\n`;
    case 'diagram':{
      if(block.diagramType!=='flow'||block.groups?.length||block.states?.length)throw new Error('LaTeX flow groups/states require an explicit implementation');
      // Breakable static reading view of the graph. Explicit edge targets retain
      // branching and process semantics; array order never invents a connection.
      const number=new Map(block.nodes.map((node,i)=>[node.id,i+1]));
      return block.nodes.map((node,i)=>`\\par\\medskip\\noindent\\textcolor{${color(i)}}{\\textbf{${i+1}. ${latexInline(node.label)}}}`+
        (node.notation?'\\quad '+latexInline(node.notation):'')+'\\par\n'+prose(node.description??'')+'\n'+
        (node.parts??[]).map(part=>`\\par\\textbf{${latexInline(part.label)}} ${prose(part.description??'')}`).join('\n')+'\n'+
        block.edges.filter(edge=>edge.sourceNodeId===node.id).map(edge=>{
          const target=number.get(edge.targetNodeId);if(!target)throw new Error('Unknown flow target');
          return `\\par\\noindent $\\longrightarrow$ ${target}. ${latexInline(edge.label)}`;
        }).join('\n')).join('\n');
    }
    case 'code':
      if(block.code.includes('^^')||/\\end\{Verbatim\}/u.test(block.code))throw new Error('Unsafe verbatim terminator in code');
      return `\\begin{Verbatim}[fontsize=\\footnotesize,breaklines=true,breakanywhere=true]\n${block.code}\n\\end{Verbatim}\n`;
    case 'chart':
      if(block.chartType==='experiment'){
        const result=runExperiment(block);
        // Figure-specific findings belong to the authored occurrence caption.
        // Retain the complete machine-readable values in the downloadable TeX
        // source (and HTML Details), not as a second visible result catalogue.
        const details=JSON.stringify({blockId:block.id,parameters:block.parameters.map(p=>({key:p.key,label:p.label,value:p.value})),readouts:result.readouts,note:result.note,markers:result.panels.map(panel=>panel.markers??[])}).replaceAll('^','\\u005e');
        return result.panels.map(panel=>plot(panel)).join('\n')+'\n'+
          '% Full-precision experiment details: '+details+'\n';
      }
      if(block.chartType==='histogram'){
        const states=block.states??[{label:block.label,description:block.description,binCounts:block.binCounts}];
        return states.map(state=>{
          const bins=histogramBlockBins({...block,...(state.binCounts?{binCounts:state.binCounts}:{})});
          const coordinates=bins.flatMap(bin=>[{x:bin.lower,y:bin.height},{x:bin.upper,y:bin.height}]);
          const panel:ExperimentPanel={xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),
            traces:[{label:state.label,style:'area',points:[{x:bins[0]!.lower,y:0},...coordinates,{x:bins.at(-1)!.upper,y:0}]},
              ...(block.curves??[]).map(curve=>({label:curve.label,style:'line' as const,points:curve.data.map(p=>({x:p.x,y:p.y}))}))]};
          return plot(panel,'5.5cm')+(block.states?`\\noindent{\\small\\textit{${latexInline(state.description)}}}\\par\n`:'');
        }).join('\n');
      }
      if(block.chartType==='line'){
        return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),yDomain:block.yDomain,traces:block.series.map(series=>({label:series.label,style:'line',points:series.data}))})+
          (block.annotations??[]).map(a=>`\\par ${latexInline(a.label)}`).join('\n');
      }
      if(block.chartType==='dot'){
        const values=block.groups.flatMap(group=>[...group.data.map(datum=>datum.value),...(group.summary?[group.summary.value]:[]),...(group.interval?[group.interval.lower,group.interval.upper]:[])]);
        const lo=Math.min(...values,...(block.referenceLine?[block.referenceLine.value]:[])),hi=Math.max(...values,...(block.referenceLine?[block.referenceLine.value]:[]));
        const pad=Math.max((hi-lo)*.15,.01);
        const xs=block.groups.map((group,index)=>block.xScale==='linear'?group.x!:index+1);
        const xmin=Math.min(...xs)-.5,xmax=Math.max(...xs)+.5;
        const traces:ExperimentPanel['traces'][number][] =block.groups.map((group,index)=>({label:group.label,style:'points',points:group.data.map((datum,i)=>({x:xs[index]!+(i-(group.data.length-1)/2)*Math.min(.07,.6/group.data.length),y:datum.value}))}));
        if(block.referenceLine)traces.push({label:block.referenceLine.label,style:'line',emphasis:'reference',points:[{x:xmin,y:block.referenceLine.value},{x:xmax,y:block.referenceLine.value}]});
        for(const [i,group] of block.groups.entries()){
          if(group.summary)traces.push({label:group.summary.label,style:'points',emphasis:'reference',points:[{x:xs[i]!,y:group.summary.value}]});
          if(group.interval)traces.push({label:group.interval.label,style:'line',points:[{x:xs[i]!,y:group.interval.lower},{x:xs[i]!,y:group.interval.upper}]});
          if(block.drawStems&&block.referenceLine)for(const datum of group.data)traces.push({label:group.label,style:'line',points:[{x:xs[i]!,y:block.referenceLine.value},{x:xs[i]!,y:datum.value}]});
        }
        for(const curve of block.curves??[])traces.push({label:curve.label,style:'line',points:curve.data});
        return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),xDomain:[xmin,xmax],yDomain:[block.yMinimum??lo-pad,hi+pad],...(block.xScale?{}:{xLabels:block.groups.map((group,i)=>({value:xs[i]!,label:group.label}))}),traces},'6.5cm',false)+'\n';
      }
      if(block.chartType==='bar'){
        if(block.data.every(d=>d.group!==undefined)){
          const groups=[...new Set(block.data.map(d=>d.group!))],categories=[...new Set(block.data.map(d=>d.category))];
          const slot=.8/categories.length;
          return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),xDomain:[.5,groups.length+.5],
            xLabels:groups.map((label,i)=>({value:i+1,label})),
            traces:categories.map((label,index)=>({label,style:'bars',points:block.data.filter(d=>d.category===label).map(d=>({x:groups.indexOf(d.group!)+1+(index-(categories.length-1)/2)*slot,y:d.value}))}))},'6.5cm',true,slot*.45)+
            (block.annotations??[]).map(a=>`\\par ${latexInline(a.label)}`).join('\n');
        }
        return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),xLabels:block.data.map((p,i)=>({value:i+1,label:p.category})),traces:[{label:block.label,style:'bars',points:block.data.map((p,i)=>({x:i+1,y:p.value}))}]})+
          (block.annotations??[]).map(a=>`\\par ${latexInline(a.label)}`).join('\n');
      }
      if(block.chartType==='box'){
        const traces:ExperimentPanel['traces'][number][]=[];
        for(const [i,g] of block.groups.entries()){
          const q=boxPlotSummary(g.data.map(d=>d.value),block.fenceMultiplier),x=i+1;
          const line=(points:{x:number;y:number}[])=>traces.push({label:g.label,style:'line',points});
          line([{x:x-.25,y:q.lower},{x:x+.25,y:q.lower},{x:x+.25,y:q.upper},{x:x-.25,y:q.upper},{x:x-.25,y:q.lower}]);
          line([{x:x-.25,y:q.median},{x:x+.25,y:q.median}]);
          line([{x,y:q.lowerWhisker},{x,y:q.lower}]);line([{x,y:q.upper},{x,y:q.upperWhisker}]);
          for(const y of [q.lowerWhisker,q.upperWhisker])line([{x:x-.15,y},{x:x+.15,y}]);
          traces.push({label:g.label,style:'points',points:g.data.flatMap((d,j)=>block.showObservations||q.outlierIndices.includes(j)?[{x:x+(j%5-2)*.035,y:d.value}]:[])});
        }
        return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),xDomain:[.5,block.groups.length+.5],xLabels:block.groups.map((g,i)=>({value:i+1,label:g.label})),traces},'6cm',false);
      }
      if(block.chartType==='observations'){
        if(block.view==='moments')return momentMatrixLatex(block);
        if(block.view==='ecdf')return plot({xLabel:axisText(block.xAxis),yLabel:axisText(block.yAxis),xDomain:[block.threshold!.minimum,block.threshold!.maximum],yDomain:[0,1],traces:block.series.map(s=>({label:s.label,style:'line',points:[{x:block.threshold!.minimum,y:0},...empiricalSteps(s.data).flatMap(step=>[{x:step.value,y:step.left},{x:step.value,y:step.right}]),{x:block.threshold!.maximum,y:1}]}))});
        return plot({xLabel:axisText(block.xAxis),yLabel:'Observation series',yDomain:[.5,block.series.length+.5],traces:block.series.map((s,i)=>({label:s.label,style:'points',points:s.data.map((d,j)=>({x:d.value,y:i+1+(j%9-4)*.045}))}))},'6cm');
      }
      if(block.chartType==='histogram2d'){
        const cells=histogramCells(block.data,block.edges,block.yEdges),max=Math.max(...cells.map(c=>c.count));
        return '\\begin{center}\\begin{tikzpicture}\\begin{axis}[width=.94\\linewidth,height=7cm,xlabel={'+latexText(axisText(block.xAxis))+'},ylabel={'+latexText(axisText(block.yAxis))+'},xmin='+num(block.edges[0]!)+',xmax='+num(block.edges.at(-1)!)+',ymin='+num(block.yEdges[0]!)+',ymax='+num(block.yEdges.at(-1)!)+']\n'+
          cells.map(c=>`\\path[fill=pcd1!${num(100*c.count/max)}] (axis cs:${num(c.xLower)},${num(c.yLower)}) rectangle (axis cs:${num(c.xUpper)},${num(c.yUpper)});`+
            (c.count?`\\node[font=\\tiny,text=${c.count/max>.6?'white':'black'}] at (axis cs:${num((c.xLower+c.xUpper)/2)},${num((c.yLower+c.yUpper)/2)}) {${c.count}};`:'')).join('\n')+'\n\\end{axis}\\end{tikzpicture}\\end{center}\n\\noindent Cell labels give observation counts.\n';
      }
      throw new Error('Unsupported LaTeX chart type');
    default:throw new Error(`Unsupported LaTeX material: ${block.kind}`);
  }
}

/** Pure, offline projection of the validated thematic transport; no slide order. */
export function renderLatexScript(script:ThematicScript):string {
  validateThematicScript(script);
  if(script.version!=='1.1')throw new Error('LaTeX export requires captioned script 1.1');
  const numbered=resolveScriptMaterialNumbers(script);
  const byId=new Map(numbered.map(entry=>[entry.material.id!,entry]));
  const names=script.language.startsWith('de')?{figure:'Abb.',equation:'Gl.',table:'Tabelle',listing:'Listing'}:{figure:'Fig.',equation:'Eq.',table:'Table',listing:'Listing'};
  const reference=(id:string)=>{
    const entry=byId.get(id);if(!entry)throw new Error('Unresolved LaTeX script reference');
    const label=latexLabel(id);return `\\hyperref[${label}]{${names[entry.category]}~\\ref*{${label}}}`;
  };
  return String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=22mm]{geometry}
\usepackage{fontspec}
\setmainfont{Latin Modern Roman}
\setsansfont{Latin Modern Sans}
\setmonofont{Latin Modern Mono}
\usepackage{amsmath,amssymb}
\usepackage{unicode-math}
\setmathfont{Latin Modern Math}
\usepackage{longtable,array,fvextra,adjustbox,needspace}
\usepackage{pgfplots}
\usepackage{pdflscape}
\pgfplotsset{compat=1.18}
\usepackage[colorlinks=true,linkcolor=blue,urlcolor=blue,unicode=true]{hyperref}
\usepackage{xurl}
\newcounter{listing}
\newcounter{scripttable}
\definecolor{pcd1}{HTML}{005A78}
\definecolor{pcd2}{HTML}{6B2CB1}
\definecolor{pcd3}{HTML}{447766}
\definecolor{pcd4}{HTML}{9A3E20}
\definecolor{pcd5}{HTML}{756000}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.65em}
\setlength{\emergencystretch}{3em}
\begin{document}
`+`\\hypersetup{pdftitle={${latexText(script.title)}},pdfsubject={Authored thematic script},pdfcreator={Project Chemie Digital LaTeX exporter}}\n\\title{${latexInline(script.title)}}\n\\author{}\n\\date{}\n\\maketitle\n\\tableofcontents\n\\clearpage\n`+
    script.sections.map(section=>`\\section{${latexInline(section.title)}}\n`+
      resolveScriptSectionFlow(section).map(item=>{
        if(item.kind==='prose')return prose(item.body,reference)+'\n\n';
        const material=item.material;
        const entry=byId.get(material.id!)!;const label=latexLabel(material.id!);
        const landscape=material.blocks.some(b=>b.kind==='chart'&&b.chartType==='observations'&&b.view==='moments');
        const longEquation=entry.category==='equation'&&material.blocks.some(b=>b.kind==='math'&&b.derivation);
        const start=entry.category==='equation'&&!longEquation?'\\begin{samepage}\n':entry.category==='figure'?'\\Needspace{10cm}\n':'\\Needspace{8\\baselineskip}\n';
        const counter=entry.category==='table'?'scripttable':entry.category;
        return (landscape?'\\begin{landscape}\n':'')+`\\par\\medskip\n${start}\\refstepcounter{${counter}}\\label{${label}}\n`+
          `\\noindent\\textbf{${names[entry.category]}~\\ref*{${label}}.} ${latexInline(material.caption!)}\\par\\nopagebreak\n`+
          material.blocks.map(block=>entry.category==='equation'&&block.kind==='definition-list'
            ?`\\par\\noindent\\textbf{${script.language.startsWith('de')?'Symbole':'Symbols'}}\n\n`+
              block.entries.map(legendEntryLatex).join('\n\n')+'\n'
            :blockLatex(block)).join('\n')+(entry.category==='equation'&&!longEquation?'\n\\end{samepage}':'')+'\n\\medskip\n'+(landscape?'\\end{landscape}\n':'');
      }).join('\n')).join('\n\\clearpage\n')+
    '\n\\end{document}\n';
}
