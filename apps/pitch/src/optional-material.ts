/** Bound the panel in logical slide pixels without shrinking code typography. */
export function optionalWorkspaceBounds(rect: {left:number;top:number;width:number;height:number}, logicalWidth:number, logicalHeight:number, viewportWidth:number, viewportHeight:number) {
  if(![...Object.values(rect),logicalWidth,logicalHeight,viewportWidth,viewportHeight].every(Number.isFinite)||!(logicalWidth>0&&logicalHeight>0&&rect.width>0&&rect.height>0&&viewportWidth>0&&viewportHeight>0))return;
  const sx=rect.width/logicalWidth,sy=rect.height/logicalHeight,gap=12;
  const left=Math.max(rect.left+gap*sx,8),top=Math.max(rect.top+gap*sy,8);
  const right=Math.min(rect.left+rect.width-gap*sx,viewportWidth-8),bottom=Math.min(rect.top+rect.height-gap*sy,viewportHeight-8);
  if(right-left<40||bottom-top<40)return;
  return {left:(left-rect.left)/sx,top:(top-rect.top)/sy,width:(right-left)/sx,height:(bottom-top)/sy};
}

/** Native disclosure, not a modal: keeps the same scene and full source text. */
export function mountOptionalMaterial(root: HTMLElement, refresh: () => void): () => void {
  // Outside .slides: Reveal's slide transform must not scale the mobile editor.
  const portal=document.createElement('div');portal.className='pcd-optional-workspace-portal';
  portal.classList.add('reveal');document.body.append(portal);
  // Preserve theme tokens while escaping the slide root's stacking context.
  const theme=getComputedStyle(root);
  for(const property of theme)if(property.startsWith('--pcd-'))portal.style.setProperty(property,theme.getPropertyValue(property));
  const origins=new Map<HTMLDetailsElement,Comment>();
  const clear=(details:HTMLDetailsElement)=>{
    for(const property of ['left','top','width','height','right','bottom','--pcd-optional-summary-height'])details.style.removeProperty(property);
  };
  const restore=(details:HTMLDetailsElement)=>{
    const marker=origins.get(details);if(!marker)return;
    const focused=details.contains(document.activeElement)?document.activeElement as HTMLElement:null;
    marker.replaceWith(details);origins.delete(details);clear(details);focused?.focus({preventScroll:true});
  };
  const all=()=>[...root.querySelectorAll<HTMLDetailsElement>('.pcd-optional-material'),...origins.keys()];
  const fit=(details:HTMLDetailsElement)=>{
    if(window.innerWidth<=700){
      if(!origins.has(details)){
        const marker=document.createComment('Optional R workspace');details.before(marker);origins.set(details,marker);
        const focused=details.contains(document.activeElement)?document.activeElement as HTMLElement:null;
        clear(details);portal.append(details);focused?.focus({preventScroll:true});
      }
    }else{
      restore(details);
      const slide=details.closest<HTMLElement>('section');if(!slide)return;
      const bounds=optionalWorkspaceBounds(slide.getBoundingClientRect(),slide.offsetWidth,slide.offsetHeight,window.innerWidth,window.innerHeight);
      if(!bounds)return;
      for(const [key,value] of Object.entries(bounds))details.style.setProperty(key,`${value}px`);
      details.style.right='auto';details.style.bottom='auto';
    }
    const summary=details.querySelector<HTMLElement>(':scope > summary');
    if(summary)details.style.setProperty('--pcd-optional-summary-height',`${summary.offsetHeight+2}px`);
  };
  const key = (event: KeyboardEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const details = target.closest<HTMLDetailsElement>(".pcd-optional-material");
    if (!details) return;
    event.stopPropagation();
    if (event.key === "Escape" && details.open) {
      event.preventDefault(); details.open = false;
      restore(details);clear(details);
      details.querySelector<HTMLElement>("summary")?.focus({preventScroll: true});
    }
  };
  const toggle = (event: Event) => {
    if (event.target instanceof HTMLDetailsElement && event.target.matches(".pcd-optional-material")) {
      if(event.target.open){fit(event.target);refresh();}
      else {restore(event.target);clear(event.target);}
    }
  };
  const escape = (event: KeyboardEvent) => {if (event.key === "Escape") key(event);};
  const close = () => all().forEach(details => {details.open = false;restore(details);clear(details);});
  const resize=()=>{all().filter(details=>details.open).forEach(fit);refresh();};
  root.addEventListener("keydown", key);
  root.addEventListener("keydown", escape, true);
  root.addEventListener("toggle", toggle, true);
  portal.addEventListener('keydown',key);
  portal.addEventListener('keydown',escape,true);
  portal.addEventListener('toggle',toggle,true);
  window.addEventListener("beforeprint", close);
  window.addEventListener("resize",resize);
  return () => {close();portal.removeEventListener('keydown',key);portal.removeEventListener('keydown',escape,true);portal.removeEventListener('toggle',toggle,true);portal.remove();root.removeEventListener("keydown", key);root.removeEventListener("keydown", escape, true);root.removeEventListener("toggle", toggle, true);window.removeEventListener("beforeprint", close);window.removeEventListener("resize",resize);};
}
