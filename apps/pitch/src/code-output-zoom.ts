import { createExplanationDialog } from "./explanation-dialog.ts";

export function mountCodeOutputZoom(root:HTMLElement):()=>void {
  const modal=createExplanationDialog("pcd-output-dialog","pcd-output-dialog-title");
  const outputs=[...root.querySelectorAll<HTMLElement>(".code-output")];
  outputs.forEach(output=>{output.tabIndex=0;output.setAttribute("role","button");output.setAttribute("aria-haspopup","dialog");output.setAttribute("aria-label","Enlarge code output");output.title="Click to enlarge output";});
  const open=(output:HTMLElement)=>{const pre=document.createElement("pre");pre.className="pcd-enlarged-output";pre.textContent=output.textContent??"";modal.open("Code output",pre,output);};
  const click=(e:MouseEvent)=>{const output=(e.target as Element).closest<HTMLElement>(".code-output");if(!output)return;e.preventDefault();e.stopPropagation();open(output);};
  const key=(e:KeyboardEvent)=>{const output=(e.target as Element).closest<HTMLElement>(".code-output");if(!output||!["Enter"," "].includes(e.key))return;e.preventDefault();e.stopPropagation();open(output);};
  root.addEventListener("click",click);root.addEventListener("keydown",key,true);
  return()=>{root.removeEventListener("click",click);root.removeEventListener("keydown",key,true);outputs.forEach(o=>{o.removeAttribute("role");o.removeAttribute("tabindex");o.removeAttribute("aria-haspopup");o.removeAttribute("aria-label");o.removeAttribute("title");});modal.destroy();};
}
