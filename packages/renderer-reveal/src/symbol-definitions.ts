/** Explicitly authored Markdown definition rows, never inferred from prose.
 * RDF remains the source; this is only a shared presentation projection. */
import {renderInlineText} from './inline-math.ts';
export function renderSymbolDefinitions(text:string):string|undefined {
  const [definitions,...notes]=text.trim().split(/\r?\n\s*\r?\n/u);
  const rows=definitions!.split(/\r?\n/u).map(line=>/^- \*\*(.+?)\*\*:\s+(.+)$/u.exec(line));
  if(!rows.length||rows.some(row=>!row))return undefined;
  const pairs=rows.map(row=>`<div class="authored-symbol-definition"><dt>${renderInlineText(row![1]!)}</dt><dd>${renderInlineText(row![2]!)}</dd></div>`).join('');
  return `<dl class="authored-symbol-definitions">${pairs}</dl>${notes.map(note=>`<p class="authored-symbol-conventions">${renderInlineText(note).replaceAll('\n','<br>')}</p>`).join('')}`;
}
