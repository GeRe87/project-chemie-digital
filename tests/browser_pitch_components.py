"""Capture diagram, table and math details from the actual selected lecture."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:5194/')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    targets = {
        'ex:scene-vr26--scene': ('precision-targets', '.media-reference img'),
        'ex:scene-vm-recap--scene': ('paired-correction-chart', '.d3-chart-svg'),
        'ex:scene-uq-matrix--scene': ('replication-process', '.d3-flow-svg'),
        'ex:scene-vr32--scene': ('lake-chart', '.d3-chart-svg'),
        'ex:scene-vr34--scene': ('qc-unit-table', '[data-component-kind="data-surface"]'),
        'ex:scene-vr06--scene': ('mathematical-symbol-legend', '[data-symbol-legend], .derivation-legend'),
    }
    records = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        for theme in ['dark', 'light']:
            for width, height in [(1440, 900), (1280, 720)]:
                page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                page.goto(args.url+'?theme='+theme, wait_until='networkidle')
                page.locator('.pitch-course-world-shell button[data-scene-document-id="ex:path-chemometrics-variance-dispersion-lecture--scene-document"]').click()
                page.wait_for_selector('.slides section.present')
                for sid, (name, selector) in targets.items():
                    page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})", sid)
                    page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')", arg=sid)
                    scene = page.locator('[id="'+sid+'"]')
                    scene.locator('h2').click()
                    for _ in range(scene.locator('.fragment').count()):
                        page.keyboard.press('ArrowRight')
                    element = scene.locator(selector).first
                    filename = f'{name}-{theme}-{width}.png'
                    element.screenshot(path=str(out/filename))
                    records.append({'scene':sid, 'selector':selector, 'theme':theme, 'viewport':[width,height], 'file':filename})
                    if sid == 'ex:scene-uq-matrix--scene':
                        filename = f'replication-matrix-{theme}-{width}.png'
                        scene.locator('[data-component-kind="data-surface"]').screenshot(path=str(out/filename))
                        records.append({'scene':sid,'theme':theme,'viewport':[width,height],'file':filename})
                page.close()
        browser.close()
    (out/'components.json').write_text(json.dumps(records, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
