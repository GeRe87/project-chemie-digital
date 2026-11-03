import katex from "katex";

export function escapeInlineText(text:string):string {
  return text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
export function renderInlineMath(expression:string,displayMode=false):string {
  return katex.renderToString(expression,{displayMode,output:'htmlAndMathml',throwOnError:false,trust:false});
}
/** Explicit authored delimiters only. Code and arbitrary prose stay literal. */
export function renderInlineText(text:string):string {
  const tokens=/`([^`\n]+)`|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\*\*([^*\n]+)\*\*/gu;
  let result='',end=0;
  for(const match of text.matchAll(tokens)){
    result+=escapeInlineText(text.slice(end,match.index));
    if(match[1]!==undefined)result+=`<code>${escapeInlineText(match[1])}</code>`;
    else if(match[4]!==undefined)result+=`<strong>${escapeInlineText(match[4])}</strong>`;
    else result+=renderInlineMath(match[2]??match[3]!);
    end=match.index!+match[0].length;
  }
  return result+escapeInlineText(text.slice(end));
}
