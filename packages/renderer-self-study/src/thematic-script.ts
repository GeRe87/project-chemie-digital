import {validateThematicScript,resolveScriptMaterialNumbers,resolveScriptSectionFlow,type ThematicScript} from '../../core/src/thematic-script.ts';
import {renderStudyInline,escapeStudyText} from './teaching-text.ts';
import {renderSelfStudyBlocks} from './index.ts';

export function renderThematicScript(script:ThematicScript):string {
  validateThematicScript(script);
  const esc=escapeStudyText;
  const provenance=(source:ThematicScript['source'])=>esc(JSON.stringify([...new Set(source.flatMap(s=>s.provenanceIds??[]))]));
  const anchor=(index:number)=>`script-${encodeURIComponent(script.id)}-${index+1}`;
  const materialAnchor=(id:string)=>`script-material-${encodeURIComponent(script.id)}-${encodeURIComponent(id)}`;
  const labels=script.language.startsWith('de')?{figure:'Abb.',equation:'Gl.',table:'Tabelle',listing:'Listing'}:{figure:'Fig.',equation:'Eq.',table:'Table',listing:'Listing'};
  const materials=new Map(resolveScriptMaterialNumbers(script).filter(entry=>entry.material.id).map(entry=>[entry.material.id!,entry]));
  const reference=(target:string)=>{
    const id=target.startsWith('ex:')?'https://w3id.org/project-chemie-digital/resource/'+target.slice(3):target;
    const entry=materials.get(id);if(!entry)throw new Error('Unresolved script reference');
    return `<a class="script-cross-reference" data-target-material-id="${esc(id)}" href="#${esc(materialAnchor(id))}">${labels[entry.category]} ${entry.number}</a>`;
  };
  const renderMaterial=(material:ThematicScript['sections'][number]['materials'][number])=>{
    if(script.version==='1.0')return renderSelfStudyBlocks(material.blocks);
    const entry=materials.get(material.id!)!;const id=materialAnchor(material.id!);
    return `<figure class="script-material" id="${esc(id)}" tabindex="-1" data-script-material-id="${esc(material.id!)}" data-material-resource-id="${esc(material.resourceId)}" data-material-category="${entry.category}" data-material-number="${entry.number}" data-provenance-ids="${provenance(material.source!)}" aria-labelledby="${esc(id)}-caption"><figcaption class="script-material-caption" id="${esc(id)}-caption"><strong>${labels[entry.category]} ${entry.number}.</strong> ${renderStudyInline(material.caption!)}</figcaption>${renderSelfStudyBlocks(material.blocks,{captioned:true,graphical:true})}</figure>`;
  };
  const nav=`<nav class="pcd-script-contents" aria-label="Script contents"><h2>Contents</h2><ol>${script.sections.map((s,i)=>`<li><a href="#${esc(anchor(i))}">${renderStudyInline(s.title)}</a></li>`).join('')}</ol></nav>`;
  return `<article class="thematic-script" lang="${esc(script.language)}" data-script-resource="${esc(script.id)}" data-provenance-ids="${provenance(script.source)}">${nav}${script.sections.map((s,i)=>
    `<section class="self-study-section pcd-script-section" id="${esc(anchor(i))}" data-script-section="${esc(s.id)}" data-provenance-ids="${provenance(s.source)}" data-related-scene-ids="${esc(s.relatedSceneIds.join(' '))}" aria-labelledby="${esc(anchor(i))}-title"><h2 id="${esc(anchor(i))}-title">${i+1}. ${renderStudyInline(s.title)}</h2>${resolveScriptSectionFlow(s).map(item=>item.kind==='prose'?`<div class="self-study-narration"><p>${renderStudyInline(item.body,script.version==='1.1'?reference:undefined)}</p></div>`:renderMaterial(item.material)).join('')}</section>`).join('')}</article>`;
}
