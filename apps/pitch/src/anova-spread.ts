const offsets = [[-2,-1],[-1.5,1.7],[-1,0.4],[-.6,-2],[-.2,2.1],[.2,-.4],[.6,1],[1,-1.8],[1.5,2],[2,-2]];
const centres = [[-2,-1.8],[0,1.8],[2,0]];
const colors = ["#0075b3","#aa4b00","#8652af"];
const points = (scales: readonly number[]) => centres.map(([cx,cy],g)=>offsets.map(([x,y],i)=>[
  cx + scales[g]! * offsets[(i+3*g)%offsets.length]![0]!,
  cy + scales[g]! * y!,
]));
const mean = (v: readonly number[]) => v.reduce((a,b)=>a+b,0)/v.length;
const variance = (v: readonly number[]) => {
  if (v.every(value => value === v[0])) return 0;
  const m=mean(v);
  return v.reduce((sum,y)=>sum+(y-m)**2,0)/(v.length-1);
};
const svg = (name:string, attrs:Record<string,string|number>) => {
  const el=document.createElementNS("http://www.w3.org/2000/svg",name);
  for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,String(value));
  return el;
};

export function mountAnovaSpreadLab(root: HTMLElement) {
  const slide=root.querySelector<HTMLElement>('[id="ex:l7-scene-spread-lab--scene"]');
  const figure=slide?.querySelector('figure[data-media-uri="/chemometrics/anova-spread-panels.svg"]');
  if(!figure)return;
  const lab=document.createElement("div");
  lab.className="pcd-spread-lab";
  lab.dataset.presentationStepHost="anova-spread";
  lab.dataset.presentationStepCount="3";
  const controls=document.createElement("div");
  controls.className="pcd-spread-controls";
  const sliders=centres.map((_,i)=>{
    const label=document.createElement("label");
    label.textContent=`Group ${"ABC"[i]} scatter`;
    label.style.borderColor=colors[i]!;
    const input=document.createElement("input");
    input.type="range";input.min="0";input.max="2.5";input.step=".05";input.value="1";
    label.append(input);
    controls.append(label);
    return input;
  });
  const plot=svg("svg",{viewBox:"0 0 480 285",role:"img","aria-label":"x–y scatter plot of the three groups"});
  const stats=document.createElement("div");
  stats.className="pcd-spread-stats";
  const body=document.createElement("div");
  body.className="pcd-spread-body";
  body.append(plot,stats);
  lab.append(controls,body);
  figure.replaceWith(lab);

  let stage=1;
  const render=()=>{
    const groups=points(sliders.map(s=>Number(s.value)));
    const ys=groups.map(group=>group.map(p=>p[1]!));
    const means=ys.map(mean), variances=ys.map(variance);
    const within=mean(variances), between=variance(means);
    const px=(x:number)=>242+x*26, py=(y:number)=>135-y*16;
    plot.replaceChildren(svg("path",{d:"M35 16V253H455",fill:"none",stroke:"currentColor"}));
    for(const [letter,x,y] of [["x",457,272],["y",15,22]] as const){
      const text=svg("text",{x,y,fill:"currentColor","font-size":16});
      text.textContent=letter;plot.append(text);
    }
    groups.forEach((group,i)=>{
      const color=colors[i]!;
      group.forEach(([x,y])=>plot.append(svg("circle",{cx:px(x!),cy:py(y!),r:4.5,fill:color,opacity:.78})));
      const [x,y]=centres[i]!;
      plot.append(svg("path",{d:`M${px(x!)-7} ${py(y!)}h14m-7 -7v14`,stroke:"currentColor","stroke-width":2.5}));
    });
    const f=(x:number)=>x.toFixed(2);
    const table=document.createElement("table");
    const head=table.createTHead().insertRow();
    for(const label of ["Group","Mean of y","Sample variance of y"]){
      const th=document.createElement("th");th.textContent=label;head.append(th);
    }
    const tbody=table.createTBody();
    means.forEach((m,i)=>{
      const row=tbody.insertRow();
      for(const value of ["ABC"[i]!,f(m),f(variances[i]!)])row.insertCell().textContent=value;
      row.cells[0]!.style.borderInlineStart=`4px solid ${colors[i]}`;
    });
    stats.replaceChildren(table);
    const summaries=[
      ["Total sample variance of y",f(variance(ys.flat()))],
      ["Average of the three group variances",f(within)],
      ["Sample variance of the three group means",f(between)],
      ["Variance of means ÷ average group variance",within===0?"Undefined (within = 0)":f(between/within)],
    ];
    for(const [index,[label,value]] of summaries.slice(0,stage).entries()){
      const row=document.createElement("div");row.className="pcd-spread-stat";
      const number=document.createElement("strong");number.textContent=value!;
      const step=document.createElement("span");
      step.className="pcd-spread-stat-step";
      step.textContent=String(index+1);
      step.setAttribute("aria-hidden","true");
      row.append(step,label!,number);
      stats.append(row);
    }
  };
  sliders.forEach(input=>input.addEventListener("input",render));
  lab.addEventListener("pcd-presentation-step",event=>{
    const next=1+(event as CustomEvent<{step:number}>).detail.step;
    if(next!==stage){stage=next;render();}
  });
  render();
}

export function mountAnovaPairReveal(root: HTMLElement) {
  const figure = root.querySelector<HTMLElement>('figure[data-media-uri="/chemometrics/anova-pair-range.svg"]');
  if (!figure) return;
  figure.dataset.presentationStepCount = "1";
  figure.addEventListener("pcd-presentation-step", event => {
    const { step } = (event as CustomEvent<{ step: number }>).detail;
    figure.dataset.pairRevealed = String(step > 0);
    figure.setAttribute("aria-label", step > 0
      ? "C versus G: Bonferroni-adjusted p 0.027. All ten methods: omnibus ANOVA p 0.059."
      : "Ten methods in label order with twelve observations per method.");
  });
}
