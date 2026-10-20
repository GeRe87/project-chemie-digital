"""Execute the R lab through the real lazy-loaded course, retaining network evidence."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5194/');parser.add_argument('--output',required=True);parser.add_argument('--probe',action='store_true');args=parser.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    records=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        for theme,width,height in ([('dark',1440,900)] if args.probe else [(theme,w,h) for theme in ['dark','light'] for w,h in [(1440,900),(1280,720)]]):
            page=browser.new_page(viewport={'width':width,'height':height})
            log={'theme':theme,'viewport':[width,height],'url':args.url,'responses':[],'failures':[],'errors':[],'runs':[]}
            page.on('response',lambda r:log['responses'].append({'url':r.url,'status':r.status,'type':r.headers.get('content-type')}) if '/vendor/' in r.url else None)
            page.on('requestfailed',lambda r:log['failures'].append({'url':r.url,'failure':r.failure}))
            page.on('pageerror',lambda e:log['errors'].append(str(e)))
            try:
                for restart in range(1 if args.probe else 2):
                    page.goto(args.url+'?theme='+theme,wait_until='networkidle')
                    assert not any('/webr/' in r['url'] for r in log['responses'] if restart==0)
                    page.locator('.pitch-course-world-shell button[data-scene-document-id="ex:path-chemometrics-variance-dispersion-lecture--scene-document"]').click()
                    page.wait_for_selector('.slides section.present');page.wait_for_selector('.cm-content',state='attached')
                    docs=page.locator('.slides section[data-scene-document-id]').evaluate_all('es=>[...new Set(es.map(e=>e.dataset.sceneDocumentId))]')
                    assert docs==['ex:path-chemometrics-variance-dispersion-lecture--scene-document'],docs
                    assert not page.evaluate("()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/webr/'))"), 'webR initialized before Run'
                    # Reading order and actual navigation controls, never deck.slide().
                    for _ in range(200):
                        scene=page.locator('.slides section.present')
                        if scene.locator('.cm-content').count():break
                        page.locator('.pcd-presentation-navigation .navigate-next').click();page.wait_for_timeout(70)
                    else:raise AssertionError('R lab not reachable')
                    for run in range(1 if args.probe else 3):
                        scene=page.locator('.slides section.present')
                        editor=scene.locator('.cm-content').first;editor.click();page.keyboard.press('ControlOrMeta+A')
                        # Probe prints explicitly to distinguish module import failures
                        # from the old wrapper's last-expression-only behavior.
                        code='a <- c(9, 10, 13)\nmean(a)\nvar(a)\nsd(a)' if not args.probe else 'a <- c(9, 10, 13)\nprint(mean(a))\nprint(var(a))\nsd(a)'
                        page.keyboard.insert_text(code);scene.get_by_role('button',name='Run',exact=True).first.click()
                        page.wait_for_function("()=>{const s=document.querySelector('.slides section.present');const b=s?.querySelector('.code-run-button'),o=s?.querySelector('.code-output');return b&&!b.disabled&&o&&!/Loading|Output will appear/.test(o.textContent)}",timeout=120000)
                        text=scene.locator('.code-output').first.text_content();log['runs'].append({'restart':restart,'run':run,'scene':scene.get_attribute('id'),'output':text})
                        page.screenshot(path=str(out/f'webr-{theme}-{width}-{restart}-{run}.png'))
                        assert 'Error:' not in text,text
                        assert all(s in text for s in ['10.666','4.333','2.081']),text
                        if run==1:
                            sid=scene.get_attribute('id');page.locator('.pcd-presentation-navigation .navigate-next').click();page.wait_for_timeout(350)
                            log['after_next']=page.locator('.slides section.present').get_attribute('id')
                            page.locator('.pcd-presentation-navigation .navigate-prev').click();page.wait_for_timeout(350)
                            actual=page.locator('.slides section.present').get_attribute('id')
                            log['return_geometry']=page.evaluate("""id=>({actual:document.querySelector('.slides section.present')?.id,bodyScroll:document.body.scrollTop,windowScroll:scrollY,pages:[...document.querySelectorAll('.scroll-page')].filter(p=>p.contains(document.getElementById(id))||p.contains(document.querySelector('.slides section.present'))).map(p=>({top:p.getBoundingClientRect().top,offset:p.offsetTop,parent:p.offsetParent?.className,height:p.clientHeight}))})""",sid)
                            assert actual==sid,(sid,actual)
                assert not log['errors'] and not log['failures'],log
                log['passed']=True
            except Exception as e:
                log['passed']=False;log['error']=repr(e);page.screenshot(path=str(out/f'failure-{theme}-{width}.png'))
            finally:
                records.append(log);page.close()
        browser.close()
    (out/'webr-inspection.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    for record in records:print(record['theme'],record['passed'],record.get('error'),record['failures'])
    assert all(r['passed'] for r in records)

if __name__=='__main__':main()
