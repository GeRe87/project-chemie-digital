"""Actual layout, typography and original R programs for the review corrections."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5194/');p.add_argument('--output',required=True);args=p.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720)]:
            for theme in ['dark','light']:
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference')
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle')
                page.locator('.pitch-course-world-shell button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.slides section.present')
                def enter(name):
                    sid='ex:scene-'+name+'--scene';page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})",sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid)
                    return page.locator('[id="'+sid+'"]')
                extreme=enter('vr36')
                layout=extreme.evaluate("""s=>{const r=k=>s.querySelector('[data-composition-region-container="'+k+'"]').getBoundingClientRect();let a=r('prelude'),b=r('primary'),c=r('secondary'),d=r('footer');return {profile:s.dataset.compositionProfile,left:a.right<c.left&&b.right<c.left&&d.right<c.left,order:a.bottom<=b.top+3&&b.bottom<=d.top+3,colours:[...s.querySelectorAll('thead th')].map(t=>getComputedStyle(t).backgroundColor)}}""")
                assert layout['profile']=='data-visual' and layout['left'] and layout['order'],layout
                assert len(set(layout['colours']))>=3,layout
                for name,fragments in [('vr24',['10.666']),('vr25',['4.333','36.333','2.081','6.027']),('vr37',['0.158','1.007','1.581','10.074'])]:
                    scene=enter(name);page.wait_for_selector('.cm-content',state='attached')
                    typography=scene.locator('.poll-prompt').evaluate("e=>({bullets:e.querySelectorAll('li').length,weights:[...e.querySelectorAll('li')].map(x=>getComputedStyle(x).fontWeight),strong:e.querySelectorAll('strong').length,highlights:e.querySelectorAll('.pcd-marker-highlight').length,raw:/[*][*]|==|minutes/i.test(e.innerText)})")
                    assert typography['bullets']>=3 and all(w=='400' for w in typography['weights']) and typography['strong'] and typography['highlights'] and not typography['raw'],typography
                    scene.get_by_role('button',name='Run',exact=True).click()
                    page.wait_for_function("()=>{const s=document.querySelector('.slides section.present'),b=s?.querySelector('.code-run-button'),o=s?.querySelector('.code-output');return b&&!b.disabled&&o&&!/Loading|Output will appear/.test(o.textContent)}",timeout=120000)
                    text=scene.locator('.code-output').text_content();assert 'Error:' not in text and all(v in text for v in fragments),text
                    page.screenshot(path=str(out/f'original-{name}-{theme}-{width}.png'))
                    checks.append({'theme':theme,'width':width,'lab':name,'typography':typography,'output':text})
                result=enter('se-example');assert 'one estimated SE' in result.inner_text() and '95%' in result.inner_text()
                checks.append({'theme':theme,'width':width,'extreme_layout':layout})
                page.close()
        browser.close()
    (out/'review-checks.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf8')
    assert not errors,errors
    print('Passed',len(checks),'checks; original R programs:',sum('lab' in x for x in checks))

if __name__=='__main__':main()
