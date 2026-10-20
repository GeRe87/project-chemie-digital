/** Decorative trail follows actual DOM landmarks, not hard-coded level identities.
 * One batched geometry update on resize; no wheel/scroll hot-path work. */
export function worldTrailPath(points:readonly {x:number;y:number}[]):string {
  return points.map((point,index)=>{
    if(!index)return `M ${point.x} ${point.y}`;
    const previous=points[index-1]!;
    if(Math.abs(point.x-previous.x)<20)return ` C ${previous.x+70} ${previous.y+35}, ${point.x+70} ${point.y-35}, ${point.x} ${point.y}`;
    const middle=(previous.x+point.x)/2;
    return ` C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }).join("");
}

export function mountCourseWorldMap(root:HTMLElement):()=>void {
  let frame:number|undefined;
  const maps=[...root.querySelectorAll<HTMLElement>(".pitch-world-atlas")];
  const draw=()=>{
    frame=undefined;
    for(const map of maps){
      const bounds=map.getBoundingClientRect();if(!bounds.width||!bounds.height)continue;
      const svg=map.querySelector<SVGSVGElement>(".pitch-world-trail")!;
      const points=[...map.querySelectorAll<HTMLElement>(".pitch-world-marker")].map(marker=>{const r=marker.getBoundingClientRect();return{x:r.left-bounds.left+r.width/2,y:r.top-bounds.top+r.height/2};});
      svg.setAttribute("viewBox",`0 0 ${bounds.width} ${bounds.height}`);
      const path=worldTrailPath(points);svg.querySelectorAll("path").forEach(p=>p.setAttribute("d",path));
    }
  };
  const schedule=()=>{if(frame===undefined)frame=requestAnimationFrame(draw);};
  const observer=typeof ResizeObserver==="undefined"?undefined:new ResizeObserver(schedule);
  maps.forEach(map=>observer?.observe(map));window.addEventListener("resize",schedule);schedule();
  return()=>{observer?.disconnect();window.removeEventListener("resize",schedule);if(frame!==undefined)cancelAnimationFrame(frame);};
}
