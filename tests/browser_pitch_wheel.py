"""Native wheel input, including sustained/fast detents; no click fallback."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

STATE = """()=>{const s=document.querySelector('.slides section.present');return {
 id:s?.id,h:Number(s?.dataset.indexH),v:Number(s?.dataset.indexV),
 f:Math.max(-1,...[...s?.querySelectorAll('.fragment.visible')??[]].map(f=>Number(f.dataset.fragmentIndex))),
 stages:[...s?.querySelectorAll('[data-presentation-step-count]')??[]].map(e=>({step:Number(e.dataset.presentationStep??0),count:Number(e.dataset.presentationStepCount)})),
 focus:document.activeElement?.className,overlay:!!document.querySelector('dialog[open]'),
 lock:document.body.classList.contains('pcd-stage-lock-active'),scroll:document.querySelector('.reveal-viewport')?.scrollTop,
 top:s?.getBoundingClientRect().top,world:document.body.classList.contains('pcd-course-world-active')};}"""

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default='http://127.0.0.1:5194/')
    parser.add_argument('--output',required=True)
    parser.add_argument('--probe',action='store_true')
    args=parser.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    log={'url':args.url,'cases':[],'errors':[]}
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        page=browser.new_page(viewport={'width':1280,'height':720})
        page.on('pageerror',lambda e:log['errors'].append(str(e)))
        def enter(sid=None):
            page.goto('about:blank')
            page.goto(args.url+('#/'+sid if sid else ''),wait_until='networkidle')
            if not sid:
                page.locator('.pitch-course-world-shell button[data-scene-document-id="ex:path-chemometrics-variance-dispersion-lecture--scene-document"]').click()
            page.wait_for_selector('.slides section.present')
            page.wait_for_timeout(300)
            page.evaluate("""()=>{window.wheelEvidence=[];window.addEventListener('wheel',e=>{
              const before={id:document.querySelector('section.present')?.id,dy:e.deltaY,mode:e.deltaMode,time:e.timeStamp};
              setTimeout(()=>window.wheelEvidence.push({...before,prevented:e.defaultPrevented}),0);
            },{capture:true,passive:true})}""")
            page.mouse.move(350,320)
        def wheel(dy=120,delay=60):
            page.mouse.wheel(0,dy);page.wait_for_timeout(delay)
        def save(case):
            case['events']=page.evaluate('window.wheelEvidence');log['cases'].append(case)
        try:
            if args.probe:
                for name,sid,interval in [('sustained-stages','ex:scene-cv-algebra--scene',60),('plain-detents','ex:scene-vr35--scene',280),('tail-stream','ex:scene-vr35--scene',60)]:
                    enter(sid);case={'case':name,'interval':interval,'initial':page.evaluate(STATE),'states':[]}
                    for i in range(20):
                        wheel(delay=interval);case['states'].append(page.evaluate(STATE))
                    page.wait_for_timeout(500);case['final']=page.evaluate(STATE)
                    page.screenshot(path=str(out/(name+'.png')));save(case)
            else:
                # Complete pure-wheel traversal in each direction. Slow discrete
                # detents must advance exactly one stage/scene, including plain pages.
                enter();ids=page.locator('.slides section:not([data-course-level-buffer]):not([data-course-return-sentinel])').evaluate_all('es=>es.map(e=>e.id)')
                case={'case':'full-wheel-both-directions','initial':page.evaluate(STATE),'states':[]}
                positions=page.locator('.slides section').evaluate_all("es=>es.flatMap(s=>[-1,...new Set([...s.querySelectorAll('.fragment')].map(f=>Number(f.dataset.fragmentIndex)))].map(f=>({id:s.id,f})))")
                start=next(i for i,s in enumerate(positions) if s['id']==ids[0] and s['f']==-1)
                last=next(i for i,s in reversed(list(enumerate(positions))) if s['id']==ids[-1])
                for direction in [1,-1]:
                    indices=range(start+1,last+1) if direction==1 else range(last-1,start-1,-1)
                    for index in indices:
                        before=page.evaluate(STATE);expected=positions[index]
                        wheel(120*direction,320);actual=page.evaluate(STATE)
                        case['states'].append({'input':{'deltaY':120*direction,'interval':320},'before':before,'expected':expected,'actual':actual})
                        assert actual['id']==expected['id'] and actual['f']==expected['f'],case['states'][-1]
                save(case)
                # Sustained detents must keep making progress without an idle gap.
                enter('ex:scene-cv-algebra--scene');case={'case':'fast-sustained','initial':page.evaluate(STATE),'states':[]}
                for i in range(45):wheel(delay=45);case['states'].append(page.evaluate(STATE))
                assert len({(s['id'],s['f']) for s in case['states']})>=5,case
                save(case)
                # Overlay wheel stays in its own content; closing restores real
                # wheel navigation despite focus on the operation button.
                enter('ex:scene-cv-algebra--scene');wheel(delay=350)
                page.locator('section.present .derivation-operation').first.click()
                before=page.evaluate(STATE);page.mouse.move(640,400)
                for _ in range(6):wheel(delay=40)
                after=page.evaluate(STATE);assert (before['id'],before['f'])==(after['id'],after['f'])
                page.keyboard.press('Escape');page.mouse.move(350,320);wheel(delay=350)
                after_close=page.evaluate(STATE);assert after_close['f']>before['f'] or after_close['id']!=before['id']
                save({'case':'overlay-interruption','before':before,'while_open':after,'after_close':after_close})
                enter('ex:scene-cv-algebra--scene');case={'case':'mixed-stages','initial':page.evaluate(STATE),'states':[]}
                cursor=next(i for i,s in enumerate(positions) if s['id']==case['initial']['id'] and s['f']==-1)
                for device,direction in [('wheel',1),('keyboard',1),('wheel',1),('keyboard',-1),('wheel',-1),('keyboard',1),('wheel',1)]:
                    cursor+=direction
                    if device=='wheel':wheel(120*direction,320)
                    else:page.keyboard.press('ArrowRight' if direction>0 else 'ArrowLeft');page.wait_for_timeout(320)
                    actual=page.evaluate(STATE);expected=positions[cursor]
                    case['states'].append({'input':device,'direction':direction,'expected':expected,'actual':actual})
                    assert actual['id']==expected['id'] and actual['f']==expected['f'],case['states'][-1]
                save(case)
                # Late scenes, direction changes and keyboard/wheel mixtures.
                enter('ex:scene-vr35--scene');case={'case':'tail-mixed','initial':page.evaluate(STATE),'states':[]}
                for i in range(12):
                    if i%3==0:page.keyboard.press('ArrowRight');page.wait_for_timeout(320)
                    else:wheel(delay=320)
                    case['states'].append(page.evaluate(STATE))
                    if page.locator('section.present[data-course-level-buffer="true"]').count():break
                assert any(s['id']!=case['initial']['id'] for s in case['states'])
                save(case)
                assert page.locator('section.present[data-course-level-buffer="true"]').count()
                wheel(delay=350);page.wait_for_selector('.pitch-course-world-shell')
                page.locator('.pitch-course-world-shell button[data-scene-document-id="ex:path-chemometrics-variance-dispersion-lecture--scene-document"]').click()
                page.wait_for_selector('.slides section.present');page.wait_for_timeout(300)
                log['restart']={'via':'wheel-level-end / overworld / Start','state':page.evaluate(STATE)}
                assert log['restart']['state']['id']==ids[0]
                log['passed']=not log['errors']
        except Exception as e:
            log['passed']=False;log['failure']=repr(e);log['failure_state']=page.evaluate(STATE)
            log['last_events']=page.evaluate('window.wheelEvidence');page.screenshot(path=str(out/'failure.png'))
        finally:
            (out/'wheel.json').write_text(json.dumps(log,indent=2),encoding='utf-8');browser.close()
    print(json.dumps({k:v for k,v in log.items() if k!='cases'},indent=2))
    if not args.probe:assert log.get('passed'),log.get('failure')

if __name__=='__main__':main()
