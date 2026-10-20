"""Verify actual background-layer movement, not merely slide animation."""
import argparse,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright

START="""()=>{window.__backgroundFrames=[];const start=performance.now();const sample=()=>{window.__backgroundFrames.push({time:performance.now()-start,scene:document.querySelector('.slides section.present')?.id,layers:[...document.querySelectorAll('.pcd-background-stage:last-child .pcd-background-strip')].map(e=>e.style.transform)});if(performance.now()-start<1350)requestAnimationFrame(sample)};sample()}"""

def main():
    p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5194/');p.add_argument('--output',required=True);args=p.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720)]:
            for theme in ['dark','light']:
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle');page.wait_for_timeout(450)
                def enter(sid):
                    page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})",sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid);page.wait_for_timeout(1250)
                transitions=[]
                for label,source,control,target in [
                    ('plain','ex:scene-chemometrics-variance-dispersion-title--scene','next','ex:scene-vr02--scene'),
                    ('enter-staged','ex:scene-cv-helper--scene','next','ex:scene-cv-bias--scene'),
                    ('reverse','ex:scene-cv-bias--scene','prev','ex:scene-cv-helper--scene')]:
                    enter(source);page.evaluate(START);page.locator('.navigate-'+control).click()
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=target)
                    motion=page.locator('.slides section.present').evaluate("e=>e.closest('.scroll-page-content').getAnimations().map(a=>({duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes().map(k=>({translate:k.translate,opacity:k.opacity}))}))")
                    assert any(a['duration']==800 for a in motion),motion
                    page.mouse.move(200,200);page.mouse.wheel(0,1)
                    assert page.locator('#pitch-slides').get_attribute('data-page-motion')=='running'
                    page.wait_for_timeout(1450)
                    frames=page.evaluate('window.__backgroundFrames');distinct=len({str(f['layers']) for f in frames})
                    assert distinct>=20,(label,distinct)
                    late=[f for f in frames if 550<f['time']<900]
                    assert len({str(f['layers']) for f in late})>=5,(label,'background stops too early')
                    tile_heights=page.locator('.pcd-background-stage').last.locator('.pcd-background-strip').evaluate_all('es=>es.map(e=>e.querySelector("img").offsetHeight)')
                    changes=[]
                    for a,b,h in zip(frames[0]['layers'],frames[-1]['layers'],tile_heights):
                        y=lambda s:float(re.search(r'translate3d\([^,]+,\s*([-\d.]+)px',s)[1])
                        delta=abs(y(b)-y(a));delta=min(delta,abs(delta-h)) if h else delta
                        changes.append(delta)
                    assert max(changes)<=46.1,(label,changes)
                    assert page.locator('.slides section.present').get_attribute('id')==target
                    stable=page.locator('.pcd-background-stage').last.locator('.pcd-background-strip').evaluate_all('es=>es.map(e=>e.style.transform)');page.wait_for_timeout(180)
                    assert stable==page.locator('.pcd-background-stage').last.locator('.pcd-background-strip').evaluate_all('es=>es.map(e=>e.style.transform)')
                    transitions.append({'case':label,'distinct_layer_states':distinct,'motion':motion,'layer_travel_px':changes,'frames':frames})
                enter('ex:scene-uq-matrix--scene');scene=page.locator('.slides section.present')
                geometry=scene.evaluate("""s=>({colours:[...s.querySelectorAll('thead th')].map(e=>getComputedStyle(e).backgroundColor),bullets:[...s.querySelectorAll('.keypoint-list>li')].map(e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}),overflow:[...s.querySelectorAll('[data-component-kind]')].filter(e=>{let r=e.getBoundingClientRect();return r.width&&r.height&&(r.top<0||r.bottom>innerHeight+3||r.left<0||r.right>innerWidth+3)}).map(e=>e.className)})""")
                assert len(set(geometry['colours']))>=3,geometry
                a,b=geometry['bullets'];assert b['x']>a['x']+200 and abs(a['y']-b['y'])<5,geometry
                assert not geometry['overflow'],geometry
                page.screenshot(path=str(out/f'matrix-{theme}-{width}.png'))
                checks.append({'theme':theme,'width':width,'transitions':transitions,'matrix':geometry});page.close()
        page=browser.new_page(reduced_motion='reduce');page.goto(args.url,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle');page.wait_for_timeout(300)
        page.evaluate(START);page.locator('.navigate-next').click();page.wait_for_timeout(1450);frames=page.evaluate('window.__backgroundFrames')
        assert len({str(f['layers']) for f in frames})==1;page.close();browser.close()
    (out/'background-review.json').write_text(json.dumps({'checks':checks,'errors':errors,'reduced_motion_static':True},indent=2),encoding='utf8');assert not errors,errors
    print('Passed',len(checks),'theme/viewport cases; actual background movement + reduced motion verified')

if __name__=='__main__':main()
