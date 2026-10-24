/** Wrap complete categorical labels without truncating scientific names. */
export function chartLabelLines(label:string,availableWidth:number,fontSize=22):string[]{
  const limit=Math.max(7,Math.floor(availableWidth/(fontSize*.56)));
  const lines:string[]=[];let line="";
  for(const word of label.split(/\s+/u)){
    if(line&&line.length+word.length+1>limit){lines.push(line);line=word;}
    else line+=(line?" ":"")+word;
  }
  if(line)lines.push(line);return lines;
}
