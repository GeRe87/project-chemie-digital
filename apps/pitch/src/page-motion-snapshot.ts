let snapshotNumber=0;

/** A short-lived, inert copy of the painted outgoing scene. It is not a Reveal
 * slide and carries no live scene/chart bindings, listeners or duplicate IDs. */
export function capturePageMotionSnapshot(source:HTMLElement):{layer:HTMLElement;height:number} {
  const doc=source.ownerDocument,view=doc.defaultView!;
  const bounds=source.getBoundingClientRect(),style=view.getComputedStyle(source);
  const layer=doc.createElement("div");layer.className="pcd-page-motion-layer";
  layer.setAttribute("aria-hidden","true");layer.inert=true;
  const context=doc.createElement("div");
  context.className=`${source.closest(".reveal")?.className??"reveal"} pcd-page-motion-panel`;
  const slides=doc.createElement("div");slides.className="slides";
  const copy=source.cloneNode(true) as HTMLElement;
  copy.classList.remove("present","past","future");
  const width=source.offsetWidth||bounds.width,height=source.offsetHeight||bounds.height;
  copy.style.setProperty("position","absolute","important");
  copy.style.setProperty("left",`${bounds.left}px`,"important");
  copy.style.setProperty("top",`${bounds.top}px`,"important");
  copy.style.setProperty("width",`${width}px`,"important");
  copy.style.setProperty("height",`${height}px`,"important");
  copy.style.setProperty("box-sizing","border-box","important");
  copy.style.setProperty("margin","0","important");
  copy.style.setProperty("transform-origin","0 0","important");
  copy.style.setProperty("transform",`scale(${bounds.width/width},${bounds.height/height})`,"important");
  copy.style.setProperty("translate","none","important");
  copy.style.setProperty("display",style.display,"important");
  copy.style.setProperty("visibility","visible","important");
  copy.style.setProperty("opacity","1","important");
  copy.style.setProperty("transition","none","important");
  copy.style.fontSize=style.fontSize;

  const fields=source.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input,textarea,select");
  copy.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input,textarea,select").forEach((field,i)=>{
    if(!(field instanceof HTMLInputElement&&field.type==="file"))field.value=fields[i]!.value;
    if(field instanceof HTMLInputElement)field.checked=(fields[i] as HTMLInputElement).checked;
  });
  // Canvas/video pixels are not copied by cloneNode. Use the current frame when
  // same-origin drawing is possible; do not start a second media runtime.
  const media=source.querySelectorAll<HTMLCanvasElement|HTMLVideoElement>("canvas,video");
  copy.querySelectorAll<HTMLCanvasElement|HTMLVideoElement>("canvas,video").forEach((target,i)=>{
    const original=media[i]!;
    try{
      const canvas=doc.createElement("canvas");
      canvas.width=original instanceof HTMLVideoElement?original.videoWidth:original.width;
      canvas.height=original instanceof HTMLVideoElement?original.videoHeight:original.height;
      if(!canvas.width||!canvas.height)throw new Error("No current frame");
      canvas.getContext("2d")!.drawImage(original,0,0);
      const image=doc.createElement("img");image.src=canvas.toDataURL();image.alt="";image.className=target.className;
      image.style.cssText=target.style.cssText;
      image.style.width=`${original.offsetWidth}px`;image.style.height=`${original.offsetHeight}px`;
      target.replaceWith(image);
    }catch{
      if(target instanceof HTMLVideoElement){target.removeAttribute("src");target.removeAttribute("autoplay");target.querySelectorAll("source").forEach(s=>s.remove());}
    }
  });
  copy.querySelectorAll("script,iframe,object,embed,audio").forEach(node=>node.remove());
  const prefix=`pcd-page-snapshot-${++snapshotNumber}-`,ids=new Map<string,string>();
  for(const node of [copy,...copy.querySelectorAll<HTMLElement>("[id]")]){
    if(node.id){const id=prefix+ids.size;ids.set(node.id,id);node.id=id;}
  }
  for(const node of [copy,...copy.querySelectorAll("*")]){
    node.removeAttribute("data-scene-document-id");node.removeAttribute("data-source-scene-id");node.removeAttribute("data-chart-block-id");
    for(const attribute of [...node.attributes]){
      if(attribute.name.startsWith("on")){node.removeAttribute(attribute.name);continue;}
      let value=attribute.value.replace(/url\(["']?#([^\s)"']+)["']?\)/gu,(match,id:string)=>ids.has(id)?`url(#${ids.get(id)})`:match);
      if(["aria-labelledby","aria-describedby","aria-controls","for"].includes(attribute.name))value=value.split(/\s+/u).map(id=>ids.get(id)??id).join(" ");
      if(["href","xlink:href"].includes(attribute.name)&&value.startsWith("#")&&ids.has(value.slice(1)))value="#"+ids.get(value.slice(1));
      if(value!==attribute.value)node.setAttribute(attribute.name,value);
    }
  }
  slides.append(copy);context.append(slides);layer.append(context);doc.body.append(layer);
  return {layer,height:view.innerHeight};
}
