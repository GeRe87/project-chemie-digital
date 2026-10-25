/** Shared modal lifecycle for mathematical explanations and enlarged outputs. */
export function createExplanationDialog(className = "", titleId = "pcd-explanation-title") {
  const dialog=document.createElement("dialog");dialog.className=`pcd-rule-dialog ${className}`;
  dialog.dataset.presentationModal="true";dialog.setAttribute("aria-labelledby",titleId);
  const header=document.createElement("header"),title=document.createElement("h2"),close=document.createElement("button");
  title.id=titleId;close.type="button";close.className="pcd-rule-close";close.textContent="×";close.setAttribute("aria-label","Close explanation");
  const body=document.createElement("div");body.className="pcd-rule-dialog-body";body.tabIndex=0;
  header.append(title,close);dialog.append(header,body);document.body.append(dialog);
  let invoker:HTMLElement|SVGElement|undefined;
  const dismiss=()=>{if(dialog.open)dialog.close();};
  const restore=()=>{document.body.classList.toggle("pcd-rule-dialog-open",!!document.querySelector('dialog[data-presentation-modal][open]'));invoker?.focus({preventScroll:true});};
  const cancel=(e:Event)=>{e.preventDefault();dismiss();};
  const key=(e:KeyboardEvent)=>{
    if(!dialog.open)return;e.stopImmediatePropagation();
    if(e.key==="Escape"){e.preventDefault();dismiss();}
    else if(e.key==="Tab"){
      e.preventDefault();const items=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),summary,a[href],input,textarea,select,[tabindex="0"]')].filter(x=>x.getBoundingClientRect().height>0);
      const i=items.indexOf(document.activeElement as HTMLElement);(items[(i+(e.shiftKey?-1:1)+items.length)%items.length]??close).focus();
    }else if(["ArrowRight","ArrowLeft"].includes(e.key))e.preventDefault();
    else if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," "].includes(e.key)&&!(e.target as Element).closest("button,summary")){
      e.preventDefault();if(e.key==="Home")body.scrollTop=0;else if(e.key==="End")body.scrollTop=body.scrollHeight;
      else body.scrollBy(0,(["ArrowUp","PageUp"].includes(e.key)?-1:1)*(e.key.startsWith("Arrow")?40:body.clientHeight*.8));
    }else if(["ArrowDown","ArrowUp","PageDown","PageUp"].includes(e.key)){
      e.preventDefault();body.scrollBy(0,(["ArrowUp","PageUp"].includes(e.key)?-1:1)*body.clientHeight*.8);
    }
  };
  const wheel=(e:Event)=>{if(!dialog.open)return;e.stopImmediatePropagation();if(!(e.target instanceof Node)||!dialog.contains(e.target))e.preventDefault();};
  close.addEventListener("click",dismiss);dialog.addEventListener("cancel",cancel);dialog.addEventListener("close",restore);
  window.addEventListener("keydown",key,true);window.addEventListener("wheel",wheel,{capture:true,passive:false});window.addEventListener("touchmove",wheel,{capture:true,passive:false});window.addEventListener("beforeprint",dismiss);
  return {body,dialog,open(label:string,content:Node|string,from:HTMLElement|SVGElement){
    for(const other of document.querySelectorAll<HTMLDialogElement>('dialog[data-presentation-modal][open]'))if(other!==dialog)other.close();
    invoker=from;title.textContent=label;if(typeof content==="string")body.innerHTML=content;else body.replaceChildren(content);
    document.body.classList.add("pcd-rule-dialog-open");if(!dialog.open)dialog.showModal();body.scrollTop=0;close.focus({preventScroll:true});
  },destroy(){dismiss();dialog.removeEventListener("close",restore);dialog.removeEventListener("cancel",cancel);window.removeEventListener("keydown",key,true);window.removeEventListener("wheel",wheel,true);window.removeEventListener("touchmove",wheel,true);window.removeEventListener("beforeprint",dismiss);dialog.remove();}};
}
