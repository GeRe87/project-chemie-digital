import {validateThematicScript, type ThematicScript} from './thematic-script.ts';

export const SCRIPT_PDF_FORMAT = 'latex-script-1.2';

/** One UTF-8 input for browser/build freshness checks; generated JSON only. */
export function scriptPdfFingerprintInput(script:ThematicScript):string {
  validateThematicScript(script);
  const ordered=(value:unknown):unknown=>{
    if(Array.isArray(value))return value.map(ordered);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value)
      .filter(([,item])=>item!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,ordered(item)]));
    return value;
  };
  return JSON.stringify(ordered({format:SCRIPT_PDF_FORMAT,script}));
}
