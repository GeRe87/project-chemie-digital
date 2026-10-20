"""Measure the world/selected-level boundary and check direct/base-path links."""
import argparse
import json
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

def metrics(page):
    return page.evaluate("""()=>({resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.encodedBodySize,duration:r.duration})),
     measures:performance.getEntriesByType('measure').map(m=>({name:m.name,duration:m.duration})),heap:performance.memory?.usedJSHeapSize,
     dom:document.querySelectorAll('*').length,slides:document.querySelectorAll('.slides section').length,
     documents:[...new Set([...document.querySelectorAll('.slides section[data-scene-document-id]')].map(s=>s.dataset.sceneDocumentId))],
     charts:document.querySelectorAll('[data-chart-block-id] svg').length})""")

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:5194/');parser.add_argument('--output',required=True);args=parser.parse_args()
    results={};errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True);page=browser.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(args.url,wait_until='networkidle');page.wait_for_selector('.pitch-course-world-shell');results['world']=metrics(page)
        assert results['world']['slides']==0 and results['world']['charts']==0
        assert not any('presentation-main' in r['name'] or 'graph-scene-data' in r['name'] or 'canonical-runtime.json' in r['name'] for r in results['world']['resources'])
        document='ex:path-chemometrics-variance-dispersion-lecture--scene-document'
        page.locator('.pitch-course-world-shell button[data-scene-document-id="'+document+'"]').click();page.wait_for_selector('.slides section.present');page.wait_for_load_state('networkidle');results['selected']=metrics(page)
        assert results['selected']['documents']==[document]
        assert len([r for r in results['selected']['resources'] if '/course-runtime/' in r['name'] and r['name'].endswith('.json') and not r['name'].endswith('/manifest.json')])==1
        for kind,link,expected in [
          ('scene-id',args.url+'#/ex:scene-cv-helper--scene','ex:scene-cv-helper--scene'),
          ('level-id',args.url+'?level='+quote(document),'ex:scene-chemometrics-variance-dispersion-title--scene'),
          ('legacy-numeric',args.url+'#/9','ex:scene-chemometrics-variables-title--scene')]:
            page.goto(link,wait_until='networkidle');page.wait_for_selector('.slides section.present')
            current=page.locator('.slides section.present').get_attribute('id')
            # Legacy index 9 is the first Variables scene: 7 intro + 2 boundaries.
            if kind=='legacy-numeric':assert 'variables' in current,(kind,current)
            else:assert current==expected,(kind,current,expected)
            results[kind]={'scene':current,'single_document':len(metrics(page)['documents'])==1}
        assert not errors,errors;results['errors']=errors
        browser.close()
    Path(args.output).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('World:',len(results['world']['resources']),'resources,',sum(r['bytes'] for r in results['world']['resources']),'bytes;',results['world']['measures'])
    print('Selected:',results['selected']['slides'],'sections,',results['selected']['charts'],'charts;',results['selected']['measures'])

if __name__=='__main__':main()
