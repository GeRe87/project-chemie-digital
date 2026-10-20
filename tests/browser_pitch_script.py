"""Script reading view: math, actual figures, layout and preserved slide state."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_pitch_derivation_details import STATE

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5194/');parser.add_argument('--output',required=True);args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    artifact=json.loads(Path('apps/pitch/src/generated/canonical-runtime.json').read_text(encoding='utf8'))
    document=next(d for d in artifact['sceneDocuments'] if 'variance-dispersion' in d['id'])
    checks=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720)]:
            for theme in ['light','dark']:
                page=browser.new_page(viewport={'width':width,'height':height});page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle')
                page.evaluate("document.getElementById('ex:scene-cv-algebra--scene').closest('.scroll-page').scrollIntoView({behavior:'instant'})");page.wait_for_timeout(300)
                page.locator('.slides section.present h2').click();page.keyboard.press('ArrowRight');before=page.evaluate(STATE)
                page.locator('.pcd-script-toggle').click();pane=page.locator('.pcd-script-view');page.wait_for_function("()=>document.querySelectorAll('.pcd-script-view .self-study-chart-host svg').length===10")
                assert pane.locator('.self-study-narration').count()==48
                assert pane.locator('.katex-error').count()==0
                assert pane.locator('summary',has_text='Observation table').count()==0
                assert pane.locator('.self-study-narration .katex-html').count()>=45
                assert pane.locator('dt .katex-html').count()>=60
                assert pane.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
                reports=[]
                for position,scene in enumerate(document['scenes'],1):
                    section=pane.locator('[data-source-scene-id="'+scene['id']+'"]');section.evaluate("e=>e.scrollIntoView({block:'start',behavior:'instant'})")
                    assert section.evaluate("e=>getComputedStyle(e).display==='block'")
                    assert section.evaluate('e=>e.scrollWidth<=e.clientWidth+2'),scene['id']
                    text=section.locator('.self-study-narration').evaluate("e=>{const c=e.cloneNode(true);c.querySelectorAll('.katex').forEach(k=>k.remove());return c.textContent}")
                    assert '$' not in text and '\\bar' not in text and '\\sigma' not in text,text
                    for chart in [b for b in scene['blocks'] if b['kind']=='chart']:
                        host=section.locator('[data-chart-block-id="'+chart['id']+'"]');assert host.locator('svg').is_visible()
                        assert host.locator('.d3-dot-point').count()==sum(len(g['data']) for g in chart['groups'])
                    path=out/f'{theme}-{width}-{position:02}.png';page.screenshot(path=str(path))
                    reports.append({'position':position,'scene':scene['id'],'math':section.locator('.katex').count(),'charts':section.locator('.self-study-chart-host svg').count()})
                section=pane.locator('[data-source-scene-id="ex:scene-cv-helper--scene"]');section.evaluate("e=>e.scrollIntoView({block:'start'})")
                proof=section.locator('.self-study-proof').first;proof.locator(':scope > summary').click();assert proof.locator('.mathematical-detail').is_visible()
                assert proof.locator('.katex-error').count()==0;page.screenshot(path=str(out/f'proof-{theme}-{width}.png'))
                proof.locator(':scope > summary').click()
                # Return to the original reading section without changing stages.
                pane.locator('[data-source-scene-id="ex:scene-cv-algebra--scene"]').evaluate("e=>e.scrollIntoView({block:'start'})")
                page.locator('.pcd-script-toggle').click();page.wait_for_timeout(150);assert page.evaluate(STATE)==before
                page.locator('.pcd-script-toggle').click();page.wait_for_timeout(100);assert pane.locator('.self-study-chart-host svg').count()==10
                page.locator('.pcd-theme-toggle').click();assert pane.locator('.self-study-chart-host svg').count()==10
                checks.append({'theme':theme,'width':width,'sections':reports,'stages_preserved':True,'charts_reused_on_reentry':True});page.close()
        page=browser.new_page();page.goto(args.url+'?mode=script#/ex:scene-se-sem--scene',wait_until='networkidle');page.wait_for_selector('.pcd-script-view:not([hidden])')
        assert page.locator('.pcd-script-view [data-source-scene-id="ex:scene-se-sem--scene"] .self-study-narration .katex-html').count()>=6
        page.locator('.pcd-script-toggle').click();assert page.locator('.slides section.present').get_attribute('id')=='ex:scene-se-sem--scene';page.close();browser.close()
    (out/'script-review.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf8');assert not errors,errors
    print('Passed 192 script sections, 40 chart instances, inline/display math, proofs and mode-state checks')

if __name__=='__main__':main()
