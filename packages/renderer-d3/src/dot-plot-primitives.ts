/** Shared visual primitives for categorical and distribution dot plots. */
export function dotSummaryDiamond(x: number, y: number, radius: number): string {
  return `M${x},${y-radius}L${x+radius},${y}L${x},${y+radius}L${x-radius},${y}Z`;
}

export function appendDotLegendEntry(legend: HTMLElement, label: string, kind: string): HTMLElement {
  const item=document.createElement("span"),symbol=document.createElement("i");
  symbol.className=`d3-dot-key-${kind}`;symbol.setAttribute("aria-hidden","true");
  item.append(symbol,document.createTextNode(label));legend.append(item);
  return item;
}
