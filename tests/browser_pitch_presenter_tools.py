"""Actual presenter controls, script switching, output modals and original R labs."""
import argparse,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_pitch_derivation_details import STATE

def main():
    p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5194/');p.add_argument('--output',required=True);args=p.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720)]:
            for theme in ['dark','light']:
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle')
                lamp=page.locator('.pcd-theme-toggle');script=page.locator('.pcd-script-toggle')
                assert re.fullmatch(r'\d{2}\s+\d{2}\s+[ap]\.m\.',page.locator('.presentation-clock-panel').inner_text())
                lamp.click();assert page.locator('body').get_attribute('data-presentation-theme')!=theme;lamp.click();assert page.locator('body').get_attribute('data-presentation-theme')==theme
                assert lamp.get_attribute('aria-pressed')==str(theme=='light').lower()
                page.locator('.navigate-next').click();page.wait_for_timeout(45)
                motion=page.evaluate("()=>({running:document.getElementById('pitch-slides').dataset.pageMotion,animations:document.querySelector('.slides section.present')?.closest('.scroll-page-content')?.getAnimations().length})")
                assert motion['running']=='running' and motion['animations']>0,motion
                page.screenshot(path=str(out/f'motion-{theme}-{width}.png'));page.wait_for_timeout(300)
                def enter(name):
                    sid='ex:scene-'+name+'--scene';page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})",sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')",arg=sid);page.wait_for_timeout(250)
                    return page.locator('[id="'+sid+'"]')
                for name in ['vr04','vr29']:
                    scene=enter(name);assert scene.get_attribute('data-composition-profile')=='data-visual'
                    rail=scene.evaluate("s=>{let a=s.querySelector('[data-composition-region-container=primary]').getBoundingClientRect(),b=s.querySelector('[data-composition-region-container=secondary]').getBoundingClientRect();return a.right<b.left}")
                    assert rail;page.screenshot(path=str(out/f'layout-{name}-{theme}-{width}.png'))
                scene=enter('vr34');positions=scene.locator('.keypoint-list > li').evaluate_all('es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y}))')
                assert len(positions)==2 and positions[1]['x']>positions[0]['x']+200 and abs(positions[1]['y']-positions[0]['y'])<5,positions
                for name,expected,count in [('vr24',['10.666'],3),('vr25',['4.333','36.333'],3),('vr37',['1.007','10.074'],5)]:
                    scene=enter(name);assert scene.locator('.definition-list-entry').count()==count
                    scene.get_by_role('button',name='Run',exact=True).click()
                    page.wait_for_function("()=>{const s=document.querySelector('.slides section.present'),b=s?.querySelector('.code-run-button'),o=s?.querySelector('.code-output');return b&&!b.disabled&&o&&!/Loading|Output will appear/.test(o.textContent)}",timeout=120000)
                    output=scene.locator('.code-output');text=output.text_content();assert all(x in text for x in expected),text
                    before=page.evaluate(STATE);output.click();dialog=page.locator('dialog.pcd-output-dialog[open]');dialog.wait_for();assert dialog.locator('pre').text_content()==text
                    page.keyboard.press('ArrowRight');dialog.locator('.pcd-rule-dialog-body').hover();page.mouse.wheel(0,500);assert page.evaluate(STATE)==before
                    page.screenshot(path=str(out/f'output-{name}-{theme}-{width}.png'));page.keyboard.press('Escape');page.wait_for_function("()=>!document.querySelector('dialog[open]')");assert output.evaluate('e=>e===document.activeElement')
                    output.press('Enter');dialog.wait_for();dialog.locator('.pcd-rule-close').click();assert page.evaluate(STATE)==before
                    page.screenshot(path=str(out/f'lab-{name}-{theme}-{width}.png'))
                editor_text=scene.locator('.cm-content').inner_text();output_text=scene.locator('.code-output').text_content()
                script.click();script.press('Enter');page.wait_for_timeout(120)
                assert page.locator('.slides section.present').get_attribute('id')=='ex:scene-vr37--scene'
                assert scene.locator('.cm-content').inner_text()==editor_text and scene.locator('.code-output').text_content()==output_text
                scene=enter('cv-algebra');scene.locator('h2').click();page.keyboard.press('ArrowRight');before=page.evaluate(STATE)
                script.click();pane=page.locator('.pcd-script-view');assert pane.is_visible();assert pane.locator('.self-study-narration').count()==48
                assert pane.locator('.self-study-narration ul,.self-study-narration li').count()==0
                assert pane.locator('.self-study-section').evaluate_all("es=>es.every(e=>getComputedStyle(e).display==='block')")
                page.screenshot(path=str(out/f'script-{theme}-{width}.png'));script.click();page.wait_for_timeout(150);assert page.evaluate(STATE)==before
                script.click();target=pane.locator('[data-source-scene-id="ex:scene-se-sem--scene"]');target.scroll_into_view_if_needed();target.evaluate("e=>e.scrollIntoView({block:'start',behavior:'instant'})")
                page.screenshot(path=str(out/f'script-sem-{theme}-{width}.png'));script.click();page.wait_for_timeout(200);assert page.locator('.slides section.present').get_attribute('id')=='ex:scene-se-sem--scene'
                assert '\\bar Y' in page.locator('.slides section.present .katex-mathml annotation').first.text_content()
                checks.append({'theme':theme,'width':width,'clock':True,'theme_toggle':True,'motion':motion,'labs':3,'modal_isolation':True,'script_sections':48,'same_scene_stages_preserved':True,'return_to_reading_position':True})
                page.close()
        page=browser.new_page(reduced_motion='reduce');page.goto(args.url,wait_until='networkidle');page.locator('button[data-scene-document-id*="variance-dispersion"]').click();page.wait_for_selector('.pcd-script-toggle');page.locator('.navigate-next').click();page.wait_for_timeout(40)
        assert page.locator('#pitch-slides').get_attribute('data-page-motion') is None;page.close()
        page=browser.new_page();page.goto(args.url+'?mode=script&theme=light#/ex:scene-se-sem--scene',wait_until='networkidle');page.wait_for_selector('.pcd-script-view:not([hidden])')
        assert page.locator('.pcd-script-view .self-study-narration').count()==48
        page.locator('.pcd-script-toggle').click();page.wait_for_timeout(100);assert page.locator('.slides section.present').get_attribute('id')=='ex:scene-se-sem--scene'
        page.close();browser.close()
    (out/'presenter-tools.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf8');assert not errors,errors
    print('Passed',len(checks),'theme/viewport cases; reduced-motion case passed')

if __name__=='__main__':main()
