"""Real-input Pitch traversal. Run explicitly with a Playwright-enabled Python.

Requires a running npm run pitch:intro preview; no Reveal navigation API is used.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def state(page):
    return page.evaluate("""() => {
      const s=document.querySelector('.slides section.present');
      return {id:s?.id, title:s?.querySelector('h2')?.textContent,
        fragments:[...s?.querySelectorAll('.fragment')??[]].map(f=>({index:f.dataset.fragmentIndex,visible:f.classList.contains('visible')})),
        stages:[...s?.querySelectorAll('[data-presentation-step-count]')??[]].map(h=>({id:h.dataset.presentationStepId,step:Number(h.dataset.presentationStep??0),count:Number(h.dataset.presentationStepCount)})),
        scroll:document.querySelector('.reveal-viewport')?.scrollTop??document.scrollingElement.scrollTop,
        focus:document.activeElement?.className,world:document.body.classList.contains('pcd-course-world-active')};
    }""")


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default='http://127.0.0.1:5194/')
    parser.add_argument('--output',required=True)
    parser.add_argument('--mode',choices=['keyboard','click','touch','wheel'],default='keyboard')
    parser.add_argument('--theme',default='dark')
    parser.add_argument('--width',type=int,default=1440)
    parser.add_argument('--height',type=int,default=900)
    parser.add_argument('--module',default='variance-dispersion')
    parser.add_argument('--skip-overlays',action='store_true')
    parser.add_argument('--normal-motion',action='store_true')
    args=parser.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    payload=json.loads((ROOT/'apps/pitch/src/generated/canonical-runtime.json').read_text(encoding='utf-8'))
    document=next(d for d in payload['sceneDocuments'] if args.module in d['id'])
    ids=[s['id'] for s in document['scenes']]
    log={'module':args.module,'dataset_fingerprint':payload['datasetFingerprint'],'expected_scene_order':ids,'mode':args.mode,'viewport':[args.width,args.height],'theme':args.theme,'events':[],'errors':[],'passed':False}
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        page=browser.new_page(viewport={'width':args.width,'height':args.height},reduced_motion='no-preference' if args.normal_motion else 'reduce',has_touch=args.mode=='touch')
        cdp=page.context.new_cdp_session(page) if args.mode=='touch' else None
        page.on('pageerror',lambda error:log['errors'].append(str(error)))
        def record(label):
            s=state(page);log['events'].append({'action':label,**s});log['last_success']=s;return s
        def command(direction):
            if args.mode=='keyboard':page.keyboard.press('ArrowRight' if direction=='next' else 'ArrowLeft')
            elif args.mode=='wheel' and page.locator('section.present[data-stage-lock="true"]').count():
                page.mouse.move(200,300);page.mouse.wheel(0,120 if direction=='next' else -120)
            elif args.mode=='touch':
                if page.locator('section.present[data-stage-lock="true"]').count():
                    y=300;end=y-100 if direction=='next' else y+100
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':200,'y':y}]})
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':200,'y':end}]})
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                else:page.locator('.pcd-presentation-navigation .navigate-next' if direction=='next' else '.pcd-presentation-navigation .navigate-prev').tap()
            else:page.locator('.pcd-presentation-navigation .navigate-next' if direction=='next' else '.pcd-presentation-navigation .navigate-prev').click()
            page.wait_for_timeout(240 if args.mode=='wheel' else 140)
        def enter():
            page.locator('.pitch-course-world-shell button[data-scene-document-id="'+document['id']+'"]').click()
            page.wait_for_function("()=>!document.body.classList.contains('pcd-course-world-active')")
            page.wait_for_selector('.slides section.present')
            page.wait_for_timeout(250)
            assert record('enter')['id']==ids[0]
        try:
            page.goto(args.url+'?theme='+args.theme,wait_until='networkidle')
            page.screenshot(path=str(out/'overworld.png'))
            log['load_before']=page.evaluate("""()=>({resources:performance.getEntriesByType('resource').map(r=>({name:r.name,size:r.encodedBodySize,duration:r.duration})),sections:document.querySelectorAll('.slides section').length,charts:document.querySelectorAll('[data-chart-block-id] svg').length,heap:performance.memory?.usedJSHeapSize,dom:document.querySelectorAll('*').length})""")
            enter();page.screenshot(path=str(out/'selected.png'))
            for run in range(2):
                for index,sid in enumerate(ids):
                    before=record(f'forward-{run}-{index}')
                    assert before['id']==sid,(sid,before)
                    # DOM fragment groups are the user-visible navigation positions.
                    indices=page.locator('[id="'+sid+'"] .fragment').evaluate_all("es=>[...new Set(es.map(e=>Number(e.dataset.fragmentIndex)))].sort((a,b)=>a-b)")
                    for fragment in indices:
                        command('next');current=record(f'fragment-{fragment}')
                        assert current['id']==sid,(sid,current)
                        visible=[int(f['index']) for f in current['fragments'] if f['visible']]
                        assert visible and max(visible)==fragment,(fragment,current)
                        buttons=page.locator('[id="'+sid+'"] .derivation-operation:not(:disabled)')
                        if fragment==0 and buttons.count() and not args.skip_overlays:
                            buttons.first.click();page.wait_for_function("()=>!!document.querySelector('dialog[open]')")
                            for key in ['Tab','Shift+Tab']:
                                page.keyboard.press(key)
                                assert page.locator('dialog[open]').evaluate('d=>d.contains(document.activeElement)')
                            if index%2:page.locator('dialog[open]').get_by_role('button',name='Close explanation').click()
                            else:page.keyboard.press('Escape')
                            page.wait_for_function("()=>!document.querySelector('dialog[open]')")
                            after=record('overlay-closed')
                            assert after['id']==current['id'] and after['fragments']==current['fragments']
                            assert buttons.first.evaluate('b=>document.activeElement===b')
                    if before['stages']:page.screenshot(path=str(out/f'critical-{run}-{index+1:02}.png'))
                    if run==0 and before['stages'] and index+1<len(ids):
                        for repeat in range(2):
                            command('next');assert record(f'adjacent-next-{repeat}')['id']==ids[index+1]
                            command('prev');back=record(f'adjacent-prev-{repeat}');assert back['id']==sid
                            assert all(f['visible'] for f in back['fragments'])
                    command('next');current=record('next-scene')
                    if index+1<len(ids):assert current['id']==ids[index+1],(ids[index+1],current)
                assert page.locator('section.present[data-course-level-buffer="true"]').count()==1
                if run==0:
                    for index in reversed(range(len(ids))):
                        command('prev');current=record(f'backward-{index}')
                        assert current['id']==ids[index],(ids[index],current)
                        groups=sorted({int(f['index']) for f in current['fragments']})
                        for fragment in reversed(groups):
                            command('prev');current=record(f'previous-fragment-{fragment}')
                            assert current['id']==ids[index],current
                            assert sum(f['visible'] for f in current['fragments'])==sum(int(f['index'])<fragment for f in current['fragments']),current
                    # Complete again, then use the actual level-end return path.
                    for _ in range(sum(1+len({f['index'] for f in e['fragments']}) for e in log['events'] if e['action'].startswith('forward-0-'))):command('next')
                    command('next');page.wait_for_function("()=>document.body.classList.contains('pcd-course-world-active')")
                    enter()
            assert not log['errors'],log['errors'];log['passed']=True
        except Exception as error:
            log['failure']=repr(error);log['failure_state']=state(page);page.screenshot(path=str(out/'failure.png'));raise
        finally:
            (out/'navigation.json').write_text(json.dumps(log,indent=2,ensure_ascii=False),encoding='utf-8');browser.close()


if __name__=='__main__':main()
