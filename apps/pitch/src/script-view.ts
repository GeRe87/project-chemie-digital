import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../../packages/renderer-self-study/src/index.ts";
import { mountPitchCharts } from "./chart-runtime.ts";
import { mountPitchDiagrams } from "./flow-runtime.ts";
import {symbolLegendMarkup} from "./teaching-text.ts";
import type {LectureTitle} from "./lecture-title.ts";
import type {ThematicScript} from '../../../packages/core/src/thematic-script.ts';
import {renderThematicScript} from '../../../packages/renderer-self-study/src/thematic-script.ts';
import {loadScriptPdf} from './script-pdf.ts';

interface ScriptDeck { getCurrentSlide():HTMLElement|null|undefined; }

/** Same canonical documents, existing self-study renderer, separately authored prose. */
export function mountScriptView(root:HTMLElement,presentation:HTMLElement,tools:HTMLElement,documents:readonly SceneDocument[],deck:ScriptDeck,title?:LectureTitle,scripts:ReadonlyMap<string,ThematicScript>=new Map()):()=>void {
  const button=document.createElement("button");button.type="button";button.className="pcd-script-toggle";button.setAttribute("aria-label","Switch to script");button.title="Switch to script";
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h12l4 4v14H4Z M8 9h8M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  const available=documents.every(d=>scripts.has(d.id)||d.scenes.every(s=>!!s.narration));button.disabled=!available;
  if(!available)button.title="Script prose has not yet been authored for this module";
  button.setAttribute("aria-pressed","false");tools.append(button);
  const pdfLink=document.createElement("a");pdfLink.className="pcd-script-print";pdfLink.textContent="PDF";pdfLink.setAttribute('role','link');pdfLink.setAttribute("aria-label","Open LaTeX script PDF");pdfLink.setAttribute('aria-disabled','true');pdfLink.tabIndex=0;pdfLink.title="Checking generated LaTeX PDF";pdfLink.target='_blank';pdfLink.rel='noopener';pdfLink.hidden=true;tools.append(pdfLink);
  const pane=document.createElement("main");pane.className="pcd-script-view";pane.hidden=true;pane.tabIndex=-1;pane.setAttribute("aria-label","Course script");document.body.append(pane);
  const navigateContents=(event:MouseEvent)=>{
    const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('.pcd-script-contents a, .script-cross-reference'):null;
    if(!link)return;
    const target=document.getElementById(link.getAttribute('href')!.slice(1));
    if(target&&pane.contains(target)){event.preventDefault();target.scrollIntoView({block:'start',behavior:'instant'});target.tabIndex=-1;target.focus({preventScroll:true});}
  };
  pane.addEventListener('click',navigateContents);
  let built=false,script=false,savedScene:string|undefined,disposed=false,pdfChecked=false;
  const preparePdf=async()=>{
    if(pdfChecked)return;pdfChecked=true;
    const status=pane.querySelector<HTMLElement>('.pcd-script-pdf-status');
    try{
      const thematic=documents.length===1?scripts.get(documents[0]!.id):undefined;
      if(!thematic)throw new Error('A generated LaTeX PDF requires one independently authored module script.');
      const artifact=await loadScriptPdf(thematic);if(disposed)return;
      pdfLink.href=artifact.href;pdfLink.setAttribute('aria-disabled','false');pdfLink.title='Open the LaTeX PDF generated from this script';
      if(status){status.textContent='LaTeX PDF ready for this script. ';const source=document.createElement('a');source.href=artifact.sourceHref;source.textContent='LaTeX source';source.download='script.tex';status.append(source);if(artifact.bundleHref){status.append(' · ');const bundle=document.createElement('a');bundle.href=artifact.bundleHref;bundle.textContent='Source bundle with figures';bundle.download='script-source.zip';status.append(bundle);}}
    }catch(error){if(disposed)return;pdfLink.removeAttribute('href');pdfLink.setAttribute('aria-disabled','true');pdfLink.title=error instanceof Error?error.message:'LaTeX PDF unavailable.';if(status)status.textContent=pdfLink.title;}
  };
  const preventUnavailable=(event:MouseEvent)=>{if(pdfLink.getAttribute('aria-disabled')==='true')event.preventDefault();};
  pdfLink.addEventListener('click',preventUnavailable);
  let unmountCharts:(()=>void)|undefined;
  let unmountDiagrams:(()=>void)|undefined;
  const setMode=(next:boolean)=>{
    if(next===script||!available)return;
    if(next&&!built){
       pane.innerHTML='<header class="pcd-script-header"><h1>Lecture script</h1><p class="pcd-script-pdf-status" role="status">Checking the precompiled LaTeX PDF for this script.</p></header>'+documents.map(d=>{const thematic=scripts.get(d.id);if(thematic)return renderThematicScript(thematic);const result=createSelfStudyRenderPlan(d);if(!result.plan)throw new Error(result.diagnostics.map(x=>x.message).join("; "));return renderSelfStudyHtml(result.plan,{interactive:false,narrative:true});}).join("");
      if(title){
         const header=pane.querySelector<HTMLElement>(".pcd-script-header")!;
         const authored=documents.length===1?scripts.get(documents[0]!.id):undefined;
         header.querySelector("h1")!.textContent=authored?.title??title.title;
         header.dataset.resourceId=authored?.id??title.pathId;
         header.dataset.provenanceIds=authored?[...new Set(authored.source.flatMap(s=>s.provenanceIds??[]))].join(' '):title.graphId;
        const course=document.createElement("p");course.textContent=title.course;header.prepend(course);
        const kind=document.createElement("p");kind.textContent="Lecture script";header.append(kind);
      }
      for(const entry of pane.querySelectorAll<HTMLElement>(".self-study-formula-unit dt, .self-study-formula-unit dd"))if(!entry.children.length&&!entry.closest('.authored-symbol-definitions'))entry.innerHTML=symbolLegendMarkup(entry.textContent??"");
      built=true;
    }
    let targetId=savedScene;
    if(next)savedScene=deck.getCurrentSlide()?.id;
    else {const top=pane.getBoundingClientRect().top+32;const sections=[...pane.querySelectorAll<HTMLElement>("[data-source-scene-id]")];const current=sections.find(s=>s.getBoundingClientRect().bottom>top);targetId=current?.dataset.sourceSceneId??savedScene;}
    root.dispatchEvent(new CustomEvent("pcd-presentation-stage-exit"));script=next;
    document.body.dataset.presentationMode=next?"script":"presentation";pane.hidden=!next;presentation.inert=next;presentation.setAttribute("aria-hidden",String(next));
    if(next&&!unmountCharts)unmountCharts=mountPitchCharts([...pane.querySelectorAll<HTMLElement>(".self-study-chart-host")],documents,{reducedMotion:true,readingView:true});
    if(next&&!unmountDiagrams){
      const hosts=[...pane.querySelectorAll<HTMLElement>('.self-study-diagram-host')];
      unmountDiagrams=mountPitchDiagrams(hosts,documents,{reducedMotion:true,interactionPolicy:'static'});
      for(const host of hosts){
        const figure=host.closest<HTMLElement>('.self-study-diagram');
        if(!figure||!host.querySelector('svg'))continue;
        figure.dataset.diagramEnhanced='true';
        const alternative=figure.querySelector<HTMLDetailsElement>('.self-study-diagram-text-alternative');
        if(alternative)alternative.open=false;
      }
    }
    // The authored script captions describe fixed reference figures. Exploration
    // remains in the presentation; script controls must not invalidate captions.
    if(next)for(const input of pane.querySelectorAll<HTMLInputElement>('.distribution-experiment input'))input.disabled=true;
    // One portrait paper contract, including printers that ignore named-page
    // orientation. Rotate the complete plate, not just its nine-panel SVG.
    if(next)for(const figure of pane.querySelectorAll<HTMLElement>(".self-study-scientific-chart:has(.moment-matrix)")){
      if(figure.parentElement?.classList.contains("pcd-script-matrix-page"))continue;
      const page=document.createElement("div");page.className="pcd-script-matrix-page";
      figure.before(page);page.append(figure);figure.classList.add("pcd-script-matrix-sheet");
    }
    button.setAttribute("aria-pressed",String(next));button.setAttribute("aria-label",next?"Switch to presentation":"Switch to script");button.title=button.getAttribute("aria-label")!;
    pdfLink.hidden=!next;if(next)void preparePdf();
    root.dispatchEvent(new CustomEvent("pcd-presentation-mode-change"));
    if(next){const thematic=[...pane.querySelectorAll<HTMLElement>('[data-related-scene-ids]')].find(s=>s.dataset.relatedSceneIds?.split(' ').includes(savedScene??''));(thematic??pane.querySelector<HTMLElement>(`[data-source-scene-id="${savedScene}"]`))?.scrollIntoView({block:"start",behavior:"instant"});pane.focus({preventScroll:true});}
    else {if(targetId&&targetId!==deck.getCurrentSlide()?.id)document.getElementById(targetId)?.closest<HTMLElement>(".scroll-page")?.scrollIntoView({block:"start",behavior:"instant"});root.dispatchEvent(new CustomEvent("pcd-presentation-stage-enter"));button.focus({preventScroll:true});}
    const url=new URL(location.href);if(next)url.searchParams.set("mode","script");else url.searchParams.delete("mode");history.replaceState({},"",url);
  };
  const click=()=>setMode(!script);button.addEventListener("click",click);
  // Reconfiguring Reveal resets scroll-fragment state. Shield keyboard events
  // instead, retaining native scrolling, Tab and button activation in the script.
  const shield=(event:KeyboardEvent)=>{if(script&&!(event.altKey&&["t","b"].includes(event.key.toLowerCase())))event.stopImmediatePropagation();};
  window.addEventListener("keydown",shield,true);
  if(new URLSearchParams(location.search).get("mode")==="script"&&available)setMode(true);
  return()=>{disposed=true;unmountDiagrams?.();unmountCharts?.();window.removeEventListener("keydown",shield,true);pane.removeEventListener('click',navigateContents);pdfLink.removeEventListener('click',preventUnavailable);pdfLink.remove();button.removeEventListener("click",click);button.remove();pane.remove();presentation.inert=false;presentation.removeAttribute("aria-hidden");delete document.body.dataset.presentationMode;};
}
