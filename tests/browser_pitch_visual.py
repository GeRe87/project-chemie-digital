"""Targeted visual/layout evidence from the real course entry point."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--probe',action='store_true');args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    artifact=json.loads((ROOT/'apps/pitch/src/generated/canonical-runtime.json').read_text(encoding='utf-8'))
    checks=[];errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        for width,height in ([(1440,900)] if args.probe else [(1440,900),(1280,720)]):
            for theme in (['light'] if args.probe else ['dark','light']):
                for doc in artifact['sceneDocuments']:
                    variance='variance-dispersion' in doc['id']
                    if args.probe and not variance:continue
                    numbers=range(1,len(doc['scenes'])+1) if variance else [3,5] if 'introduction' in doc['id'] else [4,6,8] if 'random-variables' in doc['id'] else [7,9,10,20,25,29]
                    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
                    page.goto('http://127.0.0.1:5194/?theme='+theme,wait_until='networkidle')
                    page.locator('.pitch-course-world-shell button[data-scene-document-id="'+doc['id']+'"]').click();page.wait_for_selector('.slides section.present')
                    for n in numbers:
                        sid=doc['scenes'][n-1]['id']
                        page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})",sid)
                        page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid)
                        scene=page.locator('[id="'+sid+'"]');scene.locator('h2').click()
                        if sid.startswith(('ex:scene-uq-','ex:scene-bf-','ex:scene-cv-')) or sid in ['ex:scene-vr17--scene','ex:scene-vm-helper--scene','ex:scene-md-aux--scene','ex:scene-vr21--scene']:
                            page.screenshot(path=str(out/f'stage-initial-{theme}-{width}-{n:02}.png'))
                        for step in range(scene.locator('.fragment').count()):
                            page.keyboard.press('ArrowRight')
                            if sid.startswith(('ex:scene-uq-','ex:scene-bf-','ex:scene-cv-')) or sid in ['ex:scene-vr17--scene','ex:scene-vm-helper--scene','ex:scene-md-aux--scene','ex:scene-vr21--scene']:
                                page.screenshot(path=str(out/f'stage-{step+1}-{theme}-{width}-{n:02}.png'))
                        page.wait_for_timeout(75)
                        detail=scene.evaluate("""s=>({title:s.querySelector('h2')?.textContent,
                         overflow:[...s.querySelectorAll('[data-component-kind],.derivation-formula,.derivation-operation,.derivation-legend')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.top< -3||r.bottom>innerHeight+3||r.left< -3||r.right>innerWidth+3)}).map(e=>e.className),
                         scroll:[...s.querySelectorAll('.pcd-composition-region,.mathematical-derivation,.derivation-formula,.derivation-rule-math,.math-display')].filter(e=>{const c=getComputedStyle(e);return (c.overflowY!=='visible'&&e.scrollHeight>e.clientHeight+5)||((c.overflowX!=='visible'||e.matches('.derivation-formula,.derivation-rule-math'))&&e.scrollWidth>e.clientWidth+5)}).map(e=>({cls:e.className,w:[e.clientWidth,e.scrollWidth],h:[e.clientHeight,e.scrollHeight],overflow:[getComputedStyle(e).overflowX,getComputedStyle(e).overflowY]})),
                          emdash:s.innerText.includes('—'),errors:s.querySelectorAll('.katex-error').length,
                          rawMarkup:[...s.querySelectorAll('.pcd-list-item-text,.definition-list-description,.poll-prompt')].some(e=>/[*][*]|==/.test(e.innerText)),
                         stems:[...s.querySelectorAll('.d3-deviation-stem')].map(e=>({id:e.dataset.datumId,delta:Number(e.dataset.deviation),from:e.getAttribute('y1'),to:e.getAttribute('y2')})),
                          legends:[...s.querySelectorAll('.derivation-legend dd,.formula-with-legend dd')].map(e=>({text:e.textContent,weight:getComputedStyle(e).fontWeight})),
                          symbolMath:[...s.querySelectorAll('.derivation-legend dt,[data-symbol-legend] dt')].map(e=>({text:e.textContent,math:!!e.querySelector('.katex')})),
                          formulaLabels:[...s.querySelectorAll('.math-expression-label')].map(e=>e.textContent),
                          regionOverlaps:[...s.querySelectorAll(':scope > .pcd-composition-region')].flatMap((a,i,es)=>es.slice(i+1).filter(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>6&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>6}).map(b=>[a.dataset.compositionRegionContainer,b.dataset.compositionRegionContainer]))})""")
                        name=f'{theme}-{width}-{doc["id"].split("chemometrics-")[-1].replace("--scene-document","")}-{n:02}.png'
                        page.screenshot(path=str(out/name));checks.append({'file':name,'scene':sid,'theme':theme,'width':width,'height':height,**detail})
                        if sid in ['ex:scene-uq-components--scene','ex:scene-uq-component-sd--scene','ex:scene-cv-algebra--scene','ex:scene-cv-expect--scene','ex:scene-cv-correction--scene']:
                            scene.locator('.derivation-operation').click();page.wait_for_selector('dialog[open]');page.screenshot(path=str(out/f'overlay-{theme}-{width}-{n:02}.png'));page.keyboard.press('Escape');page.wait_for_function("()=>!document.querySelector('dialog[open]')")
                    page.close()
        browser.close()
    (out/'visual-inspection.json').write_text(json.dumps({'views':checks,'page_errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    issues=[c for c in checks if c['overflow'] or c['scroll'] or c['emdash'] or c['errors'] or c['rawMarkup'] or c['regionOverlaps'] or any(not s['math'] for s in c['symbolMath'])]
    print(json.dumps([{'scene':c['scene'],'theme':c['theme'],'width':c['width'],'overflow':c['overflow'],'scroll':c['scroll'],'emdash':c['emdash']} for c in issues],indent=2))
    print('Views',len(checks),'browser errors',errors)
    assert not issues and not errors

if __name__=='__main__':main()
