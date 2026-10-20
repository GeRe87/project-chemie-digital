"""Both full pages must be visible in motion, not just a small entrance effect."""
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
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle')
                def enter(sid):
                    page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})",sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid);page.wait_for_timeout(1000)
                traces=[]
                for label,source,control,target,sign in [
                    ('forward','ex:scene-chemometrics-variance-dispersion-title--scene','next','ex:scene-vr02--scene',1),
                    ('staged','ex:scene-cv-helper--scene','next','ex:scene-cv-bias--scene',1),
                    ('reverse','ex:scene-cv-bias--scene','prev','ex:scene-cv-helper--scene',-1)]:
                    enter(source);original=page.locator('[id="'+source+'"]').bounding_box()
                    count=page.locator('#pitch-slides [data-scene-document-id]').count()
                    page.locator('.navigate-'+control).click();page.wait_for_function("()=>document.querySelector('.pcd-page-motion-layer')?.getAnimations().length===1")
                    page.evaluate("()=>{for(const a of document.getAnimations())if(a.effect?.getTiming().duration===800){a.pause();a.currentTime=400}}")
                    layer=page.locator('.pcd-page-motion-layer');assert layer.count()==1 and layer.get_attribute('aria-hidden')=='true'
                    assert layer.evaluate('e=>e.inert');assert layer.locator('.present,[data-scene-document-id],[data-chart-block-id]').count()==0
                    assert page.locator('#pitch-slides [data-scene-document-id]').count()==count
                    assert page.locator('.slides section.present').get_attribute('id')==target
                    assert page.locator('.slides section.present').evaluate("e=>e.closest('.scroll-page-content').inert")
                    geometry=page.evaluate("""()=>{const old=document.querySelector('.pcd-page-motion-layer'),incoming=document.querySelector('#pitch-slides section.present').closest('.scroll-page-content');return{old:old.getBoundingClientRect().toJSON(),incoming:incoming.getBoundingClientRect().toJSON(),ids:[...document.querySelectorAll('[id]')].map(e=>e.id)}}""")
                    assert abs(geometry['old']['top']+sign*height/2)<2,geometry
                    assert abs(geometry['incoming']['top']-sign*height/2)<3,geometry
                    assert len(geometry['ids'])==len(set(geometry['ids'])),'Duplicate snapshot IDs'
                    cloned=layer.locator('.slides > section').bounding_box();assert abs(cloned['x']-original['x'])<1 and abs(cloned['width']-original['width'])<1
                    assert abs(cloned['y']-(original['y']-sign*height/2))<2
                    for fraction in [.2,.5,.8]:
                        page.evaluate("t=>{for(const a of document.getAnimations())if(a.effect?.getTiming().duration===800)a.currentTime=t}",800*fraction)
                        page.screenshot(path=str(out/f'{label}-{theme}-{width}-{int(fraction*100)}.png'))
                    page.evaluate("()=>{for(const a of document.getAnimations())if(a.effect?.getTiming().duration===800)a.finish()}")
                    page.wait_for_function("()=>!document.querySelector('.pcd-page-motion-layer')&&!document.getElementById('pitch-slides').dataset.pageMotion")
                    assert page.locator('.slides section.present').get_attribute('id')==target
                    assert not page.locator('.slides section.present').evaluate("e=>e.closest('.scroll-page-content').inert")
                    traces.append({'case':label,'geometry':{k:v for k,v in geometry.items() if k!='ids'},'unique_ids':True})
                enter('ex:scene-chemometrics-variance-dispersion-title--scene')
                page.locator('.navigate-next').click();page.wait_for_timeout(80);page.locator('.navigate-next').click();page.wait_for_timeout(100)
                assert page.locator('.slides section.present').get_attribute('id')=='ex:scene-vr03--scene';assert page.locator('.pcd-page-motion-layer').count()==1
                page.wait_for_timeout(850);assert page.locator('.pcd-page-motion-layer').count()==0
                enter('ex:scene-vs-mc--scene');page.locator('.navigate-next').click();page.wait_for_timeout(80);page.keyboard.press('ArrowRight')
                assert page.locator('.pcd-page-motion-layer').count()==0
                enter('ex:scene-chemometrics-variance-dispersion-title--scene');page.locator('.navigate-next').click();page.wait_for_timeout(80);page.locator('.pcd-script-toggle').click()
                assert page.locator('.pcd-page-motion-layer').count()==0;assert page.locator('.pcd-script-view').is_visible();page.locator('.pcd-script-toggle').click()
                checks.append({'theme':theme,'width':width,'traces':traces,'rapid_input':True,'fragment_interrupt':True,'script_interrupt':True});page.close()
        page=browser.new_page(reduced_motion='reduce');page.goto(args.url,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle');page.locator('.navigate-next').click();assert page.locator('.pcd-page-motion-layer').count()==0;page.close();browser.close()
    (out/'page-transitions.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf8');assert not errors,errors
    print('Passed outgoing + incoming full-page geometry, forward/backward, snapshots, cleanup, rapid input and interruptions')

if __name__=='__main__':main()
