"""Overworld map: assets, responsive trails, keyboard navigation and lazy loading."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5194/');parser.add_argument('--output',required=True);args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for width,height in [(1440,900),(1280,720),(768,1024),(390,844)]:
            for theme in ['light','dark']:
                page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');shell=page.locator('.pitch-course-world-shell')
                page.wait_for_function("()=>[...document.querySelectorAll('img.pitch-world-thumbnail')].length===4&&[...document.querySelectorAll('img.pitch-world-thumbnail')].every(e=>e.complete&&e.naturalWidth>0)")
                page.wait_for_function("()=>document.querySelector('.pitch-world-trail path')?.getAttribute('d')?.includes('C')")
                assert shell.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
                assert page.locator('.slides section').count()==0
                resources=page.evaluate("()=>performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.encodedBodySize}))")
                assert not any(any(s in r['name'] for s in ['presentation-main','graph-scene-data','canonical-runtime.json','.woff','webr']) for r in resources),resources
                assert len([r for r in resources if '/course-world/' in r['name'] and '.svg' in r['name']])==4
                assert shell.locator('.pitch-world-region').count()==7
                assert shell.locator('.pitch-world-start').count()==4
                assert shell.locator('.pitch-world-region:has(.pitch-world-region-empty) button').count()==0
                assert shell.locator('img[alt=""]').count()==0
                rects=shell.locator('.pitch-world-card').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}})')
                for i,a in enumerate(rects):
                    for b in rects[i+1:]:assert min(a['right'],b['right'])<=max(a['x'],b['x']) or min(a['bottom'],b['bottom'])<=max(a['y'],b['y']),rects
                path=shell.locator('.pitch-world-trail path').first.get_attribute('d');assert path.count('C')==3,path
                page.screenshot(path=str(out/f'world-{theme}-{width}.png'))
                page.mouse.move(width/2,height/2);page.mouse.wheel(0,480);page.wait_for_timeout(200);assert shell.evaluate('e=>e.scrollTop')>0
                page.screenshot(path=str(out/f'route-{theme}-{width}.png'))
                shell.evaluate('e=>e.scrollTop=e.scrollHeight');page.screenshot(path=str(out/f'future-{theme}-{width}.png'))
                page.locator('body').click(position={'x':3,'y':3},force=True)
                # Fresh page for deterministic natural Tab order from the document.
                page.goto(args.url+'?theme='+theme,wait_until='networkidle');shell=page.locator('.pitch-course-world-shell');ids=[]
                page.keyboard.press('Tab');assert page.locator(':focus').get_attribute('href')=='#pitch-course-world-title'
                page.keyboard.press('Enter');assert page.locator(':focus').get_attribute('id')=='pitch-course-world-title'
                for _ in range(4):
                    page.keyboard.press('Tab');active=page.locator(':focus');ids.append(active.get_attribute('data-scene-document-id'));assert active.get_attribute('aria-label').startswith('Start level:')
                assert len(set(ids))==4 and all(ids),ids
                page.screenshot(path=str(out/f'keyboard-{theme}-{width}.png'))
                # Open the selected fourth level using the keyboard, then return.
                page.keyboard.press('Enter');page.wait_for_selector('.slides section.present');page.wait_for_load_state('networkidle')
                assert 'variance' in page.locator('.slides section.present').get_attribute('id')
                assert page.locator('.slides section[data-scene-document-id]').evaluate_all('es=>new Set(es.map(e=>e.dataset.sceneDocumentId)).size')==1
                back=page.get_by_role('button',name='Course Overworld',exact=True)
                if back.is_visible():
                    back.click();page.wait_for_selector('.pitch-course-world-shell');page.wait_for_function("()=>document.querySelector('.pitch-world-trail path')?.getAttribute('d')?.includes('C')")
                    assert page.locator('.pitch-world-thumbnail').count()==4
                checks.append({'theme':theme,'width':width,'resources':resources,'path':path,'keyboard_order':ids,'returned_with_button':back.is_visible() if page.locator('.slides section').count() else True})
                page.close()
        artifact=json.loads(Path('apps/pitch/src/generated/canonical-runtime.json').read_text(encoding='utf8'))
        starts=[];page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
        for document in artifact['sceneDocuments']:
            page.goto(args.url,wait_until='networkidle');page.locator('button[data-scene-document-id="'+document['id']+'"]').click();page.wait_for_selector('.slides section.present')
            assert page.locator('.slides section.present').get_attribute('id')==document['scenes'][0]['id']
            page.get_by_role('button',name='Course Overworld',exact=True).click();page.wait_for_selector('.pitch-course-world-shell');starts.append(document['id'])
        page.wait_for_function("()=>document.querySelector('.pitch-world-trail path')?.getAttribute('d')?.includes('C')")
        original=page.locator('.pitch-world-trail path').first.get_attribute('d');page.set_viewport_size({'width':390,'height':844})
        page.wait_for_function("old=>document.querySelector('.pitch-world-trail path')?.getAttribute('d')!==old",arg=original)
        assert page.locator('.pitch-course-world-shell').evaluate('e=>e.scrollWidth<=e.clientWidth+2');page.close()
        page=browser.new_page(reduced_motion='reduce');page.goto(args.url,wait_until='networkidle');card=page.locator('.pitch-world-card').first;card.hover();assert card.evaluate("e=>getComputedStyle(e).transitionDuration")=='0s';page.close();browser.close()
    (out/'overworld-review.json').write_text(json.dumps({'checks':checks,'errors':errors,'all_level_starts':starts,'live_resize':True},indent=2),encoding='utf8');assert not errors,errors
    print('Passed 8 theme/viewport cases; thumbnails, curved trails, keyboard, level start, lazy loading and reduced motion')

if __name__=='__main__':main()
