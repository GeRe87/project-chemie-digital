"""Optional complete proofs: native dialog, real input, focus and stage isolation."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

STATE="""() => {const s=document.querySelector('.slides section.present');return {id:s?.id, fragments:[...s?.querySelectorAll('.fragment')??[]].map(f=>f.classList.contains('visible')),stages:[...s?.querySelectorAll('[data-presentation-step-count]')??[]].map(h=>h.dataset.presentationStep)}}"""

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--url',default='http://127.0.0.1:5194/');args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720)]:
            for theme in ['dark','light']:
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference')
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle')
                page.locator('.pitch-course-world-shell button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.slides section.present')
                for name,count in [('zero',3),('algebra',4),('helper',9)]:
                    sid='ex:scene-cv-'+name+'--scene'
                    page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({behavior:'instant',block:'start'})",sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid)
                    scene=page.locator('[id="'+sid+'"]');button=scene.locator('button[data-derivation-detail-id]')
                    button.focus();before=page.evaluate(STATE);button.press('Enter');dialog=page.locator('dialog[open]');dialog.wait_for()
                    assert dialog.locator('[data-detail-step-id]').count()==count
                    assert dialog.locator('.fragment,[data-presentation-step-count]').count()==0
                    page.screenshot(path=str(out/f'detail-{name}-{theme}-{width}-initial.png'))
                    page.keyboard.press('Tab');page.keyboard.press('Tab')
                    assert dialog.evaluate('(d)=>d.contains(document.activeElement)')
                    for _ in range(count+4):
                        page.keyboard.press('Tab')
                        assert dialog.evaluate("d=>{const a=document.activeElement,r=a.getBoundingClientRect(),q=d.getBoundingClientRect();return d.contains(a)&&r.top>=q.top-2&&r.bottom<=q.bottom+2}")
                    page.keyboard.press('ArrowRight');page.keyboard.press('ArrowLeft')
                    body=dialog.locator('.pcd-rule-dialog-body');body.hover();page.mouse.wheel(0,800);page.wait_for_timeout(250)
                    assert page.evaluate(STATE)==before
                    # Each authored operation exposes its general rule and applied formula.
                    for index in range(count):
                        summary=dialog.locator('.mathematical-detail-step > details > summary').nth(index)
                        summary.scroll_into_view_if_needed();summary.focus();summary.press('Enter')
                        assert summary.locator('..').get_attribute('open') is not None
                        page.screenshot(path=str(out/f'detail-{name}-{theme}-{width}-operation-{index+1:02}.png'))
                        assert not dialog.locator('.katex-error').count()
                    layout=dialog.evaluate("d=>({outside:[...d.querySelectorAll('.derivation-formula,.derivation-rule-math')].filter(e=>e.scrollWidth>e.clientWidth+5).map(e=>e.className),emdash:d.innerText.includes('—')})")
                    assert not layout['outside'] and not layout['emdash'],layout
                    page.keyboard.press('Escape');page.wait_for_function("()=>!document.querySelector('dialog[open]')")
                    assert page.evaluate(STATE)==before
                    assert button.evaluate('(b)=>b===document.activeElement')
                    button.press('Space');dialog.wait_for();dialog.locator('.pcd-rule-close').click();page.wait_for_function("()=>!document.querySelector('dialog[open]')")
                    assert page.evaluate(STATE)==before
                    assert button.evaluate('(b)=>b===document.activeElement')
                    checks.append({'scene':sid,'width':width,'height':height,'theme':theme,'steps':count,'layout':layout,'state_unchanged':True,'focus_returned':True})
                page.close()
        browser.close()
    (out/'detail-review.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf8')
    assert not errors,errors
    print(json.dumps({'checks':len(checks),'errors':errors}))

if __name__=='__main__':main()
