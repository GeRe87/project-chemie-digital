import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../../packages/renderer-self-study/src/index.ts";
import { mountPitchCharts } from "./chart-runtime.ts";
import {symbolLegendMarkup} from "./teaching-text.ts";
import type {LectureTitle} from "./lecture-title.ts";

interface ScriptDeck { getCurrentSlide():HTMLElement|null|undefined; }

/** Same canonical documents, existing self-study renderer, separately authored prose. */
export function mountScriptView(root:HTMLElement,presentation:HTMLElement,tools:HTMLElement,documents:readonly SceneDocument[],deck:ScriptDeck,title?:LectureTitle):()=>void {
  const button=document.createElement("button");button.type="button";button.className="pcd-script-toggle";button.setAttribute("aria-label","Switch to script");button.title="Switch to script";
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h12l4 4v14H4Z M8 9h8M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  const available=documents.every(d=>d.scenes.every(s=>!!s.narration));button.disabled=!available;
  if(!available)button.title="Script prose has not yet been authored for this module";
  button.setAttribute("aria-pressed","false");tools.append(button);
  const printButton=document.createElement("button");printButton.type="button";printButton.className="pcd-script-print";printButton.textContent="PDF";printButton.setAttribute("aria-label","Print / Save script as PDF");printButton.title="Print / Save script as PDF";printButton.hidden=true;tools.append(printButton);
  const pane=document.createElement("main");pane.className="pcd-script-view";pane.hidden=true;pane.tabIndex=-1;pane.setAttribute("aria-label","Course script");document.body.append(pane);
  let built=false,script=false,savedScene:string|undefined;
  let unmountCharts:(()=>void)|undefined;
  const setMode=(next:boolean)=>{
    if(next===script||!available)return;
    if(next&&!built){
      pane.innerHTML='<header class="pcd-script-header"><h1>Lecture script</h1><p class="pcd-script-print-hint">For a compact, searchable PDF, choose your browser’s built-in “Save to PDF” / “Save as PDF”, not the Windows “Microsoft Print to PDF” printer, which can embed every page as a large image. Use A4, 100% scale, and disable browser headers and footers. Matrix plates are rotated within portrait pages so no automatic paper-orientation switch is needed.</p></header>'+documents.map(d=>{const result=createSelfStudyRenderPlan(d);if(!result.plan)throw new Error(result.diagnostics.map(x=>x.message).join("; "));return renderSelfStudyHtml(result.plan,{interactive:false,narrative:true});}).join("");
      if(title){
        const header=pane.querySelector<HTMLElement>(".pcd-script-header")!;
        header.querySelector("h1")!.textContent=title.title;
        header.dataset.resourceId=title.pathId;header.dataset.provenanceIds=title.graphId;
        const course=document.createElement("p");course.textContent=title.course;header.prepend(course);
        const kind=document.createElement("p");kind.textContent="Lecture script";header.append(kind);
      }
      for(const entry of pane.querySelectorAll<HTMLElement>(".self-study-formula-unit dt, .self-study-formula-unit dd"))if(!entry.children.length)entry.innerHTML=symbolLegendMarkup(entry.textContent??"");
      built=true;
    }
    let targetId=savedScene;
    if(next)savedScene=deck.getCurrentSlide()?.id;
    else {const top=pane.getBoundingClientRect().top+32;const sections=[...pane.querySelectorAll<HTMLElement>("[data-source-scene-id]")];const current=sections.find(s=>s.getBoundingClientRect().bottom>top);targetId=current?.dataset.sourceSceneId??savedScene;}
    root.dispatchEvent(new CustomEvent("pcd-presentation-stage-exit"));script=next;
    document.body.dataset.presentationMode=next?"script":"presentation";pane.hidden=!next;presentation.inert=next;presentation.setAttribute("aria-hidden",String(next));
    if(next&&!unmountCharts)unmountCharts=mountPitchCharts([...pane.querySelectorAll<HTMLElement>(".self-study-chart-host")],documents,{reducedMotion:true});
    // One portrait paper contract, including printers that ignore named-page
    // orientation. Rotate the complete plate, not just its nine-panel SVG.
    if(next)for(const figure of pane.querySelectorAll<HTMLElement>(".self-study-scientific-chart:has(.moment-matrix)")){
      if(figure.parentElement?.classList.contains("pcd-script-matrix-page"))continue;
      const page=document.createElement("div");page.className="pcd-script-matrix-page";
      figure.before(page);page.append(figure);figure.classList.add("pcd-script-matrix-sheet");
    }
    button.setAttribute("aria-pressed",String(next));button.setAttribute("aria-label",next?"Switch to presentation":"Switch to script");button.title=button.getAttribute("aria-label")!;
    printButton.hidden=!next;
    root.dispatchEvent(new CustomEvent("pcd-presentation-mode-change"));
    if(next){pane.querySelector<HTMLElement>(`[data-source-scene-id="${savedScene}"]`)?.scrollIntoView({block:"start",behavior:"instant"});pane.focus({preventScroll:true});}
    else {if(targetId&&targetId!==deck.getCurrentSlide()?.id)document.getElementById(targetId)?.closest<HTMLElement>(".scroll-page")?.scrollIntoView({block:"start",behavior:"instant"});root.dispatchEvent(new CustomEvent("pcd-presentation-stage-enter"));button.focus({preventScroll:true});}
    const url=new URL(location.href);if(next)url.searchParams.set("mode","script");else url.searchParams.delete("mode");history.replaceState({},"",url);
  };
  const click=()=>setMode(!script);button.addEventListener("click",click);
  const print=async()=>{if(!script)return;await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));window.print();};
  printButton.addEventListener("click",print);
  // Reconfiguring Reveal resets scroll-fragment state. Shield keyboard events
  // instead, retaining native scrolling, Tab and button activation in the script.
  const shield=(event:KeyboardEvent)=>{if(script&&!(event.altKey&&["t","b"].includes(event.key.toLowerCase())))event.stopImmediatePropagation();};
  window.addEventListener("keydown",shield,true);
  if(new URLSearchParams(location.search).get("mode")==="script"&&available)setMode(true);
  return()=>{unmountCharts?.();window.removeEventListener("keydown",shield,true);printButton.removeEventListener("click",print);printButton.remove();button.removeEventListener("click",click);button.remove();pane.remove();presentation.inert=false;presentation.removeAttribute("aria-hidden");delete document.body.dataset.presentationMode;};
}
