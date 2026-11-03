/** Balance columns across the minimum row count instead of greedily filling rows. */
export function balancedCardColumns(itemCount:number,capacity:number):number {
  if(!Number.isInteger(itemCount)||itemCount<0||!Number.isInteger(capacity)||capacity<1)throw new Error("Card count and positive grid capacity must be integers");
  if(!itemCount)return 1;
  return Math.ceil(itemCount/Math.ceil(itemCount/capacity));
}

/** CSS owns minimum card size; the renderer only balances its measured capacity. */
export function balanceCardGrid(grid:HTMLElement):void {
  grid.style.removeProperty("--pcd-grid-columns");
  if(!grid.clientWidth||typeof getComputedStyle==="undefined")return;
  const capacity=getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(track=>parseFloat(track)>0).length;
  if(capacity)grid.style.setProperty("--pcd-grid-columns",String(balancedCardColumns(grid.childElementCount,capacity)));
}
