import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";

// Fixed Gaussian sample offsets from the overview figure, centred per group.
const offsets = [
  [[0.7967, 1.0915], [-0.5083, 1.7025], [0.8567, -1.1157], [-0.3643, 0.0415], [1.8307, -1.5697], [0.9931, -0.1415], [-0.5631, -0.437], [-1.1662, 0.1623], [-0.8316, 0.9203], [-1.0439, -0.654]],
  [[-0.5079, -0.4583], [0.0317, 0.0943], [0.6146, 0.2593], [-0.5775, -1.554], [-0.8304, 1.1163], [0.8888, -0.4697], [0.0956, -1.237], [-0.1021, -0.3672], [0.8562, 0.7383], [-0.469, 1.8782]],
  [[1.0436, 1.3508], [-1.6866, 0.4243], [0.2881, -1.0242], [-0.8423, -0.1832], [-0.6958, 1.0978], [0.9965, -1.0082], [0.8002, 1.0163], [0.179, -1.556], [0.2202, 0.7175], [-0.3029, -0.835]],
];
const centres = [[-2,-1.8],[0,1.8],[2,0]];
const colors = ["#0075b3","#aa4b00","#8652af"];
const points = (scales: readonly number[]) => centres.map(([cx,cy],g) => {
  const scale = scales[g]!;
  return offsets[g]!.map(([dx,dy]) => [cx + scale * dx!, cy + scale * dy!]);
});
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
  lab.classList.add("pcd-visual-layout");
  lab.dataset.visualLayout = "split";
  plot.setAttribute("class", "pcd-visual-layout-plot");
  const sidebar = document.createElement("div");
  sidebar.className = "pcd-visual-layout-support";
  sidebar.append(controls, stats);
  lab.append(plot, sidebar);
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

function recoveryGroups(documents: readonly SceneDocument[]) {
  // Use the same observations as the worked example, in preparation order.
  const meansScene = documents.flatMap(document => document.scenes)
    .find(scene => scene.id === "ex:l7-intro-scene07--scene");
  const plot = meansScene?.blocks.find(block => block.kind === "chart" && block.chartType === "dot");
  return plot?.kind === "chart" && plot.chartType === "dot" ? plot.groups : undefined;
}

function recoveryDataTable(documents: readonly SceneDocument[]): HTMLTableElement | undefined {
  const groups = recoveryGroups(documents);
  if (!groups) return undefined;

  const table = document.createElement("table");
  table.className = "pcd-anova-recovery-table";
  table.hidden = true;
  table.createCaption().textContent = "One row per independent preparation";
  const header = table.createTHead().insertRow();
  const numberHeader = document.createElement("th");
  numberHeader.scope = "col";
  numberHeader.textContent = "No.";
  header.append(numberHeader);
  for (const [role, label] of [["Factor", "Method (group)"], ["Response", "Recovery (%)"]] as const) {
    const cell = document.createElement("th");
    cell.scope = "col";
    const category = document.createElement("span");
    category.className = "pcd-anova-recovery-column-role";
    category.textContent = role;
    cell.append(category, label);
    header.append(cell);
  }
  let rowNumber = 1;
  for (const group of groups) {
    const body = table.createTBody();
    for (const observation of group.data) {
      const row = body.insertRow();
      row.insertCell().textContent = String(rowNumber++);
      row.insertCell().textContent = group.label;
      row.insertCell().textContent = observation.value.toFixed(2);
    }
  }
  return table;
}

export function mountStagedTeachingSvg(root: HTMLElement, documents: readonly SceneDocument[]) {
  const stagedFigures = [
    ["/chemometrics/anova-recovery-experiment.svg", 3],
    ["/chemometrics/anova-two-to-three-groups.svg", 1],
    ["/chemometrics/level7-anova-read-table.svg", 3],
    ["/chemometrics/level7-anova-21.svg", 3],
    ["/chemometrics/level7-anova-explained-question.svg", 1],
    ["/chemometrics/level7-anova-22.svg", 1],
    ["/chemometrics/level7-anova-33.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-visual-23.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-visual-24.svg", 1],
    ["/chemometrics/level7-anova-visual-25.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-tukey-range.svg", 1],
    ["/chemometrics/level7-anova-27.svg", 1],
    ["/chemometrics/level7-anova-factorial-grid.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-marginal-means.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-model-prediction.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-model-system.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-model-pattern.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-model-components.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-two-way-observations.svg", 1],
    ["/chemometrics/level7-anova-additive-fit.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-additive-table.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-treatment-one-way.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-treatment-two-way.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-compare-patterns.svg", 1],
    ["/chemometrics/level7-anova-interaction-model.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-interaction-worked.svg", 3],
    ["/chemometrics/level7-anova-interaction-test.svg", 4, "cumulative"],
    ["/chemometrics/level7-anova-two-way-ss.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-two-way-table.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-two-way-interpretation.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-welch-weights.svg", 1],
    ["/chemometrics/level7-anova-kw-rank-sums.svg", 1],
    ["/chemometrics/level7-anova-tukey-interval.svg", 3, "cumulative"],
    ["/chemometrics/level7-anova-visual-28.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-more-factors.svg", 1],
    ["/chemometrics/level7-anova-pool-ranks.svg", 2, "cumulative"],
    ["/chemometrics/level7-anova-review-cases.svg", 3, "cumulative"],
  ] as const;
  for (const [uri, stepCount, revealMode] of stagedFigures) {
    const figure = root.querySelector<HTMLElement>(`figure[data-media-uri="${uri}"]`);
    if (!figure) continue;
    const table = uri === "/chemometrics/anova-recovery-experiment.svg" ? recoveryDataTable(documents) : undefined;
    if (table) figure.append(table);
    figure.dataset.presentationStepCount = String(stepCount + (table ? 1 : 0));
    figure.dataset.svgStageActive = "0";
    if (revealMode) figure.dataset.svgStageMode = revealMode;
    const updateCaseLabel = uri === "/chemometrics/level7-anova-review-cases.svg"
      ? (step: number) => {
          const cases = [
            "Three independent methods in one matrix with comparable error variances.",
            "Three methods tested in both water matrices.",
            "A comparison of independent group means with unequal variances.",
          ];
          const answers = ["One-way ANOVA.", "Two-way ANOVA with interaction.", "Welch ANOVA."];
          const label = cases.map((prompt, i) => (i + 1) + ". " + prompt + (i < step ? " " + answers[i] : "")).join(" ");
          figure.querySelector("img")?.setAttribute("alt", label);
          figure.querySelector("svg")?.setAttribute("aria-label", label);
        }
      : undefined;
    updateCaseLabel?.(0);
    figure.addEventListener("pcd-presentation-step", event => {
      const { step } = (event as CustomEvent<{ step: number }>).detail;
      const showTable = !!table && step === 3;
      if (table) table.hidden = !showTable;
      figure.toggleAttribute("data-recovery-table-active", showTable);
      figure.dataset.svgStageActive = String(table && step === 4 ? 3 : step);
      updateCaseLabel?.(step);
    });
  }
}

export function mountAnovaPairReveal(root: HTMLElement) {
  const figure = root.querySelector<HTMLElement>('figure[data-media-uri="/chemometrics/anova-pair-range.svg"]');
  if (!figure) return;
  figure.dataset.presentationStepCount = "1";
  figure.addEventListener("pcd-presentation-step", event => {
    const { step } = (event as CustomEvent<{ step: number }>).detail;
    figure.dataset.pairRevealed = String(step > 0);
    figure.setAttribute("aria-label", step > 0
      ? "C versus G: Bonferroni-adjusted p 0.015. All ten methods: omnibus ANOVA p 0.098."
      : "Ten methods in label order with twelve observations per method.");
  });
}

export function mountAnovaSpreadPanelTabs(root: HTMLElement, navigate: (delta: number) => void): () => void {
  // The following slide reuses the overview as a fallback for the live experiment.
  const figure = root.querySelector<HTMLElement>('figure[data-media-uri="/chemometrics/anova-spread-panels.svg"]');
  const image = figure?.querySelector("img");
  const slide = figure?.closest("section");
  if (!figure || !image || !slide) return () => {};
  figure.dataset.presentationStepCount = "2";
  figure.dataset.spreadPanelTabs = "true";

  const ribbon = document.createElement("div");
  ribbon.className = "pcd-scene-view-tabs";
  ribbon.setAttribute("role", "tablist");
  ribbon.setAttribute("aria-label", "Scatter plots");

  const panel = document.createElement("div");
  panel.id = slide.id + "-scatter-panel";
  panel.className = "pcd-spread-panel pcd-visual-stage-viewport";
  panel.setAttribute("role", "tabpanel");
  image.before(panel);
  panel.append(image);
  figure.prepend(ribbon);

  let current = 0;
  const labels = ["A", "B", "C"];
  const tabs = labels.map((label, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = slide.id + "-scatter-tab-" + label;
    tab.textContent = label;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    tab.addEventListener("click", () => navigate(index - current));
    ribbon.append(tab);
    return tab;
  });

  const update = () => {
    const svg = panel.querySelector("svg.teaching-svg");
    ribbon.hidden = !svg;
    if (!svg) return;
    svg.setAttribute("viewBox", [440 * current, 0, 440, 330].join(" "));
    svg.setAttribute("aria-label", "Scatter plot " + labels[current]);
    svg.querySelectorAll<SVGGElement>(":scope > g").forEach((group, index) => {
      group.style.display = index === current ? "" : "none";
    });
    panel.setAttribute("aria-labelledby", tabs[current]!.id);
    tabs.forEach((tab, index) => {
      tab.tabIndex = index === current ? 0 : -1;
      tab.setAttribute("aria-selected", String(index === current));
    });
  };
  const onStep = (event: Event) => {
    current = (event as CustomEvent<{ step: number }>).detail.step;
    update();
  };
  const observer = new MutationObserver(update);
  observer.observe(panel, { childList: true });
  figure.addEventListener("pcd-presentation-step", onStep);
  update();
  return () => {
    observer.disconnect();
    figure.removeEventListener("pcd-presentation-step", onStep);
  };
}
export function mountAnovaTableBuild(root: HTMLElement, documents: readonly SceneDocument[]): void {
  const groups = recoveryGroups(documents);
  if (!groups?.length) return;
  const values = groups.map(group => group.data.map(observation => observation.value));
  const n = values.reduce((total, group) => total + group.length, 0);
  const grand = mean(values.flat());
  const between = values.reduce((total, group) => total + group.length * (mean(group) - grand) ** 2, 0);
  const within = values.reduce((total, group) => {
    const center = mean(group);
    return total + group.reduce((sum, value) => sum + (value - center) ** 2, 0);
  }, 0);
  const number = new Intl.NumberFormat("en", { maximumFractionDigits: 3 });
  const betweenDf = groups.length - 1;
  const withinDf = n - groups.length;
  const betweenMS = between / betweenDf;
  const withinMS = within / withinDf;
  const f = betweenMS / withinMS;
  const rows = [
    ["Between groups", between, betweenDf, betweenMS, f],
    ["Within groups", within, withinDf, withinMS, null],
    ["Total", between + within, n - 1, null, null],
  ] as const;

  for (const [sceneId, column] of [
    ["ex:l7-scene09--scene", 1],
    ["ex:l7-scene10--scene", 2],
    ["ex:l7-scene11--scene", 3],
    ["ex:l7-scene12--scene", 4],
  ] as const) {
    const scene = root.ownerDocument.getElementById(sceneId);
    const pane = scene?.querySelector(':scope > [data-composition-region-container="primary"]');
    const visual = pane?.querySelector<HTMLElement>(':scope > :is(figure.media-reference, .d3-flow-host)');
    if (!visual) continue;
    const layout = document.createElement("div");
    layout.className = "pcd-visual-layout pcd-anova-table-build";
    layout.dataset.visualLayout = "split";
    layout.dataset.presentationStepCount = "1";
    const sidebar = document.createElement("div");
    sidebar.className = "pcd-visual-layout-support";
    const table = document.createElement("table");
    table.createCaption().textContent = "Building the ANOVA table";
    const header = table.createTHead().insertRow();
    for (const label of ["Source", "SS", "df", "MS", "F"].slice(0, column + 1)) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      header.append(cell);
    }
    const body = table.createTBody();
    for (const [label, ...statistics] of rows) {
      const row = body.insertRow();
      const name = document.createElement("th");
      name.scope = "row";
      name.textContent = label;
      row.append(name);
      for (const value of statistics.slice(0, column)) {
        row.insertCell().textContent = value === null ? "" : number.format(value);
      }
    }
    const revealColumn = (step: number) => {
      const active = column + step - 1;
      for (const row of table.rows) {
        for (const cell of row.cells) {
          cell.hidden = cell.cellIndex > active;
          cell.toggleAttribute("data-new-column", step > 0 && cell.cellIndex === active);
        }
      }
    };
    revealColumn(0);
    layout.addEventListener("pcd-presentation-step", event => {
      revealColumn((event as CustomEvent<{ step: number }>).detail.step);
    });
    sidebar.append(table);
    visual.before(layout);
    visual.classList.add("pcd-visual-layout-plot");
    layout.append(visual, sidebar);
  }
}
