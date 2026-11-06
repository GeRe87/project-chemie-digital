import {validateSceneBlocks, type SceneBlock, type SourceReference} from './scene-document.ts';

/** Renderer-neutral thematic reading order. It is not a list of slides. */
export interface ThematicScript {
  readonly version:'1.0'|'1.1';
  readonly id:string;
  readonly pathId:string;
  readonly pathGraphId:string;
  readonly language:string;
  readonly title:string;
  readonly source:readonly SourceReference[];
  readonly sections:readonly {
    readonly id:string;
    readonly title:string;
    readonly body:string;
    readonly source:readonly SourceReference[];
    readonly relatedSceneIds:readonly string[];
    readonly references?:readonly {readonly targetMaterialId:string;readonly source:readonly SourceReference[]}[];
    readonly materials:readonly {readonly id?:string;readonly caption?:string;readonly source?:readonly SourceReference[];readonly resourceId:string;readonly blocks:readonly SceneBlock[]}[];
  }[];
}

export function validateThematicScript(value:unknown):asserts value is ThematicScript {
  const record=(v:unknown):Record<string,unknown>=>{
    if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Invalid thematic script record');
    return v as Record<string,unknown>;
  };
  const text=(v:unknown)=>{if(typeof v!=='string'||!v.trim())throw new Error('Missing thematic script text');};
  const iri=(v:unknown)=>{text(v);const u=new URL(v as string);if(!['http:','https:'].includes(u.protocol)||!u.hostname||u.username||u.password||/\s/u.test(v as string))throw new Error('Invalid script IRI');};
  const array=(v:unknown):unknown[]=>{if(!Array.isArray(v))throw new Error('Invalid thematic script array');return v;};
  const sources=(v:unknown)=>{const refs=array(v);if(!refs.length)throw new Error('Missing script provenance');for(const ref of refs){const r=record(ref);iri(r.resourceId);const graphs=array(r.provenanceIds);if(!graphs.length)throw new Error('Missing script graph');graphs.forEach(iri);}};
  const script=record(value);
  if(script.version!=='1.0'&&script.version!=='1.1')throw new Error('Unsupported thematic script version');
  ['id','pathId','pathGraphId'].forEach(key=>iri(script[key]));
  ['title','language'].forEach(key=>text(script[key]));sources(script.source);
  const ids=new Set<string>();const materials=new Set<string>();const blockIds=new Set<string>();
  const occurrenceIds=new Set<string>();const referenced=new Set<string>();const numbered=new Set<string>();
  const sections=array(script.sections);if(!sections.length)throw new Error('Empty thematic script');
  for(const entry of sections){
    const section=record(entry);iri(section.id);text(section.title);text(section.body);sources(section.source);
    if(ids.has(section.id as string))throw new Error('Duplicate script section');ids.add(section.id as string);
    const related=array(section.relatedSceneIds);related.forEach(text);
    if(new Set(related).size!==related.length)throw new Error('Duplicate related scene');
    if(script.version==='1.1'){
      const refs=array(section.references);const targets=new Set<string>();
      for(const entry of refs){const ref=record(entry);iri(ref.targetMaterialId);sources(ref.source);
        if(targets.has(ref.targetMaterialId as string))throw new Error('Duplicate script reference');
        targets.add(ref.targetMaterialId as string);referenced.add(ref.targetMaterialId as string);}
      const markers=scriptReferenceTargets(section.body as string);
      if(markers.size!==targets.size||[...markers].some(id=>!targets.has(id)))throw new Error('Script prose/reference relations disagree');
    }
    for(const entry of array(section.materials)){
      const material=record(entry);iri(material.resourceId);
      if(materials.has(material.resourceId as string))throw new Error('Duplicate script material');materials.add(material.resourceId as string);
      const blocks=array(material.blocks);if(!blocks.length)throw new Error('Empty script material');
      validateSceneBlocks(blocks as SceneBlock[],'Script material','1.14');
      const typed=blocks as SceneBlock[];
      for(const block of typed){if(blockIds.has(block.id))throw new Error('Duplicate script block id');blockIds.add(block.id);}
      const first=typed[0]!;
      if(script.version==='1.1'){
        iri(material.id);text(material.caption);sources(material.source);
        if(occurrenceIds.has(material.id as string))throw new Error('Duplicate script material occurrence');
        occurrenceIds.add(material.id as string);
        if(first.kind!=='code')numbered.add(material.id as string);
        if(!['math','chart','diagram','media-reference','table','code'].includes(first.kind))throw new Error('Unsupported numbered script material');
      }
      const expand=(id:string)=>id.startsWith('ex:')?'https://w3id.org/project-chemie-digital/resource/'+id.slice(3):id;
      if(!first.source.some(s=>expand(s.resourceId)===material.resourceId))throw new Error('Script material source does not match its resource');
      if(first.kind==='math'&&!first.derivation?.legend.length&&!typed.slice(1).some(b=>b.kind==='definition-list'&&b.source.some(s=>s.relationPath==='dct:hasPart'&&first.source.some(f=>f.resourceId===s.resourceId))))throw new Error('Script formula lacks its complete authored legend unit');
    }
  }
  if([...referenced].some(id=>!occurrenceIds.has(id)))throw new Error('Script reference target is outside this exact script');
  if([...numbered].some(id=>!referenced.has(id)))throw new Error('Numbered script material requires an authored prose reference');
}

/** Stable semantic targets, skipping literal code and mathematics. */
export function scriptReferenceTargets(body:string):Set<string>{
  const tokens=/`[^`\n]+`|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\[\[ref:([^\]]*)\]\]/gu;
  const targets=new Set<string>();let end=0;
  for(const match of body.matchAll(tokens)){
    if(body.slice(end,match.index).includes('[[ref:'))throw new Error('Malformed script reference marker');
    if(match[1]!==undefined)targets.add(match[1].startsWith('ex:')?'https://w3id.org/project-chemie-digital/resource/'+match[1].slice(3):match[1]);
    end=match.index!+match[0].length;
  }
  if(body.slice(end).includes('[[ref:'))throw new Error('Malformed script reference marker');
  return targets;
}

/** Layout the authored argument with its local materials at their first explicit
 * prose reference. References across chapters navigate without moving ownership.
 * Materials first referenced together retain their authored material order. */
export function resolveScriptSectionFlow(section:ThematicScript['sections'][number]){
  const placed=new Set<string>();
  type Item={kind:'prose';body:string}|{kind:'material';material:ThematicScript['sections'][number]['materials'][number]};
  const flow:Item[]=[];
  for(const body of section.body.split(/\n\s*\n/u)){
    flow.push({kind:'prose',body});
    const targets=section.references?scriptReferenceTargets(body):new Set<string>();
    for(const material of section.materials)if(material.id&&targets.has(material.id)&&!placed.has(material.id)){
      flow.push({kind:'material',material});placed.add(material.id);
    }
  }
  for(const material of section.materials)if(!material.id||!placed.has(material.id))flow.push({kind:'material',material});
  return flow;
}

/** Disposable publication numbering follows the shared resolved reading flow. */
export function resolveScriptMaterialNumbers(script:ThematicScript):readonly {
  readonly material:ThematicScript['sections'][number]['materials'][number];
  readonly category:'figure'|'equation'|'table'|'listing';
  readonly number:number;
}[]{
  validateThematicScript(script);
  const counters={figure:0,equation:0,table:0,listing:0};
  return script.sections.flatMap(section=>resolveScriptSectionFlow(section).filter(item=>item.kind==='material').map(({material})=>{
    const kind=material.blocks[0]!.kind;
    const category=kind==='math'?'equation':kind==='table'?'table':kind==='code'?'listing':'figure';
    return {material,category,number:++counters[category]};
  }));
}
