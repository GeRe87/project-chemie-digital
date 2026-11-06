"""Compile explicitly authored thematic scripts, independent of scene order.

Existing compiled material is reused by semantic resource identity, never by
title or scene position. Formula attachments always include authored legends.
"""
from __future__ import annotations
import copy
import re
import hashlib
from pathlib import Path
from rdflib import Namespace, RDF, URIRef, Literal
from rdflib.namespace import DCTERMS

CD=Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX='https://w3id.org/project-chemie-digital/resource/'

def walk_script_blocks(blocks):
    """Traverse structural containers while retaining the original block identity."""
    for block in blocks:
        yield block
        yield from walk_script_blocks(block.get('children', []))

def script_reference_targets(body):
    """Explicit resource markers outside code/math; numbers are never authored."""
    tokens=re.compile(r'`[^`\n]+`|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\[\[ref:([^\]]*)\]\]')
    targets=set();end=0
    for match in tokens.finditer(body):
        if '[[ref:' in body[end:match.start()]:raise ValueError('Malformed script reference marker')
        if match[1] is not None:targets.add(EX+match[1][3:] if match[1].startswith('ex:') else match[1])
        end=match.end()
    if '[[ref:' in body[end:]:raise ValueError('Malformed script reference marker')
    return targets

def compile_thematic_scripts(dataset, documents, bindings):
    def objects(s,p):
        return {o for _,_,o,_ in dataset.quads((s,p,None,None))}
    def one(s,p):
        values=objects(s,p)
        if len(values)!=1: raise ValueError(f'Thematic script requires one {p} on {s}')
        return next(iter(values))
    def text(s,p,language):
        values=[str(v) for v in objects(s,p) if isinstance(v,Literal) and v.language==language]
        if len(values)!=1 or not values[0].strip():raise ValueError(f'Missing/ambiguous script text: {s} {p} @{language}')
        return values[0]
    def ordered(s,p):
        values=[(int(one(v,CD.position)),str(v),v) for v in objects(s,p)]
        values.sort()
        if [v[0] for v in values]!=list(range(1,len(values)+1)):raise ValueError(f'Noncontiguous script positions on {s}')
        return [v[2] for v in values]
    def absolute(value):
        return EX+value[3:] if value.startswith('ex:') else value
    def source(s,p=RDF.type,o=None):
        graphs=sorted({str(g) for _,_,_,g in dataset.quads((s,p,o,None))})
        if len(graphs)!=1:raise ValueError(f'Ambiguous script resource provenance: {s}')
        return [{'resourceId':str(s),'provenanceIds':graphs}]
    result=[];pairs=set()
    for binding in bindings:
        document=next(d for d in documents if d['id']==binding['sceneDocumentId'])
        available=[b for scene in document['scenes'] for b in walk_script_blocks(scene['blocks'])]
        scene_ids={s['id'] for s in document['scenes']}
        graph=dataset.graph(URIRef(binding['pathGraphId']))
        def step_objects(s,p):return set(graph.objects(s,p))
        def step_position(s):
            positions=step_objects(s,CD.position)
            if len(positions)!=1:raise ValueError('Ambiguous step position in exact path graph')
            return int(next(iter(positions)))
        steps=sorted(graph.objects(URIRef(binding['pathId']),CD.hasStep),key=step_position)
        for index,step in enumerate(steps):
            question=step_objects(step,CD.guidingQuestion)
            if question:
                if len(question)!=1 or index+1>=len(steps) or step_objects(steps[index+1],CD.answersGuidingQuestion)!=question:
                    raise ValueError('Guiding question must be answered in the immediately following selected path step')
            answered=step_objects(step,CD.answersGuidingQuestion)
            if answered and (index==0 or answered!=step_objects(steps[index-1],CD.guidingQuestion)):
                raise ValueError('Answer has no immediately preceding guiding question')
            if answered and len(step_objects(step,CD.answerResource))!=1:raise ValueError('Answer step requires one answer resource')
            for resource in question|step_objects(step,CD.answerResource):
                scenes=step_objects(step,CD.usesScene)
                selected={r for scene in scenes for item in objects(scene,CD.hasSceneItem) for r in objects(item,CD.selectsResource)}
                if resource not in selected:raise ValueError('Question/answer resource must actually be displayed in its bound step')
        for script in sorted({s for s,_,_,_ in dataset.quads((None,CD.scriptForPath,URIRef(binding['pathId']),None))},key=str):
            if str(one(script,CD.scriptPathGraph))!=binding['pathGraphId']:continue
            key=(binding['pathId'],binding['pathGraphId'])
            if key in pairs:raise ValueError('Multiple thematic scripts for the same exact path')
            pairs.add(key)
            titles=[v for v in objects(script,DCTERMS.title) if isinstance(v,Literal) and v.language]
            if len(titles)!=1:raise ValueError('Select exactly one authored script language')
            language=titles[0].language
            sections=[];used=set()
            for section in ordered(script,CD.hasScriptSection):
                related=sorted(str(v).replace(EX,'ex:')+'--scene' for v in objects(section,CD.relatedScene))
                if not set(related)<=scene_ids:raise ValueError(f'Script relates to unselected scene: {section}')
                materials=[]
                for item in ordered(section,CD.hasScriptMaterial):
                    resource=one(item,CD.scriptResource)
                    candidates=[b for b in available
                        if b['kind'] in {'math','chart','diagram','table','media-reference','code'}
                        and any(absolute(ref['resourceId'])==str(resource)
                            and (b['kind']!='media-reference' or ref.get('relationPath')=='cd:uri')
                            for ref in b.get('source',[]))]
                    if not candidates:raise ValueError(f'Script material is not available in selected content: {resource}')
                    block=copy.deepcopy(sorted(candidates,key=lambda b:b['id'])[0]); blocks=[block]
                    if block['kind']=='media-reference':
                        public=(Path(__file__).resolve().parents[1]/'apps/pitch/public').resolve()
                        uri=block['uri']
                        if not re.fullmatch(r'/[a-zA-Z0-9_./-]+\.svg',uri) or '..' in uri.split('/'):
                            raise ValueError('Script media requires a local SVG asset')
                        asset=(public/uri.lstrip('/')).resolve()
                        if not asset.is_relative_to(public) or not asset.is_file():raise ValueError('Missing script SVG asset')
                        block['integrity']='sha256-'+hashlib.sha256(asset.read_bytes()).hexdigest()
                    if block['id'] in used:raise ValueError('Script material must have one explicit placement in this version')
                    used.add(block['id'])
                    if block['kind'] in {'math','code'}:
                        legends=objects(resource,DCTERMS.hasPart)
                        legend_blocks=[copy.deepcopy(b) for b in available
                            if b['kind']=='definition-list' and any(absolute(ref['resourceId']) in {str(v) for v in legends} for ref in b.get('source',[]))]
                        # A formula can occur in several selected scenes. Its
                        # canonical legend is placed once in the script unit.
                        unique={}
                        for candidate in sorted(legend_blocks,key=lambda b:b['id']):
                            for ref in candidate.get('source',[]):
                                identity=absolute(ref['resourceId'])
                                if identity in {str(v) for v in legends}:unique.setdefault(identity,candidate)
                        embedded=block.get('derivation',{}).get('legend',[])
                        if block['kind']=='math' and not unique and not embedded:raise ValueError(f'Script formula lacks authored legend: {resource}')
                        blocks.extend(unique[key] for key in sorted(unique))
                    materials.append({'id':str(item),'caption':text(item,DCTERMS.title,language),
                        'source':source(item),'resourceId':str(resource),'blocks':blocks})
                body=text(section,CD.body,language)
                references={str(v) for v in objects(section,DCTERMS.references) if CD.ScriptMaterial in objects(v,RDF.type)}
                if script_reference_targets(body)!=references:raise ValueError(f'Script prose/reference relations disagree: {section}')
                sections.append({'id':str(section),'title':text(section,DCTERMS.title,language),
                    'body':body,'source':source(section),
                    'references':[{'targetMaterialId':target,'source':[
                        {**source(section,DCTERMS.references,URIRef(target))[0],'relationPath':'dct:references'}]} for target in sorted(references)],
                    'relatedSceneIds':related,'materials':materials})
            if not sections:raise ValueError('Thematic script is empty')
            material_ids={m['id'] for section in sections for m in section['materials']}
            referenced={r['targetMaterialId'] for section in sections for r in section['references']}
            if not referenced<=material_ids:raise ValueError('Script reference target is outside this exact script')
            numbered={m['id'] for section in sections for m in section['materials'] if m['blocks'][0]['kind']!='code'}
            if not numbered<=referenced:raise ValueError('Numbered script material requires an authored prose reference')
            result.append({'version':'1.1','id':str(script),'pathId':binding['pathId'],
                'pathGraphId':binding['pathGraphId'],'language':language,
                'title':text(script,DCTERMS.title,language),'source':source(script),'sections':sections})
    return sorted(result,key=lambda d:d['id'])
