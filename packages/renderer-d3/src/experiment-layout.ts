/** Plot coordinates follow the actual content cell, never the window width.
 * Keeping a 960px SVG in a 600px column would also shrink all its labels. */
export function experimentPlotGeometry(contentWidth:number,panelCount:number) {
  const width=Number.isFinite(contentWidth)&&contentWidth>0?contentWidth:640;
  const count=Math.max(1,panelCount);
  const stacked=count>1&&width<560;
  const plotWidth=Math.max(280,Math.floor(stacked?width:(width-16*(count-1))/count));
  return {plotWidth,stacked,height:width>=1000?240:220};
}

/** Preserve full axis titles; wrap words rather than shrinking the font. */
export function wrapExperimentAxis(text:string,availableWidth:number):string[] {
  const limit=Math.max(8,Math.floor(availableWidth/14));
  const lines:string[]=[];
  for(const word of text.split(/\s+/u)){
    const last=lines.at(-1);
    if(last&&last.length+1+word.length<=limit)lines[lines.length-1]=last+' '+word;
    else lines.push(word);
  }
  return lines;
}
