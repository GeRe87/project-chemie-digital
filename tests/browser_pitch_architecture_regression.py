"""All active documents from an immutable build; real stage inputs and R runs.

Run explicitly with Playwright/Edge, --artifact <build>/course-runtime.json,
--url <server>/, --build-head <source SHA> and --output <evidence directory>.
Overflow/font observations are diagnostics, not pixel-equality acceptance.
"""
import argparse
import atexit
import hashlib
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


MEASURE = """s=>{
  const rect=s.getBoundingClientRect();
  const visible=e=>{const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity)!==0&&e.getClientRects().length>0};
  return {scene:s.id,composition:s.dataset.composition,profile:s.dataset.compositionProfile,density:s.dataset.compositionDensity,
    rect:rect.toJSON(),mathErrors:s.querySelectorAll('.katex-error').length,
    brokenImages:[...s.querySelectorAll('img')].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),
    resources:[...s.querySelectorAll('[data-resource-id]')].flatMap(e=>e.dataset.resourceId.split(' ')),
    charts:[...s.querySelectorAll('[data-chart-block-id]')].map(e=>({id:e.dataset.chartBlockId,svg:!!e.querySelector('svg')})),
    outOfViewport:[...s.querySelectorAll('h2,blockquote,.definition-list-entry,.d3-chart-svg,.keypoint-list,table')].filter(visible)
      .filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2||r.bottom>innerHeight+2||r.left< -2||r.top< -2})
      .map(e=>({tag:e.tagName,cls:e.className,rect:e.getBoundingClientRect().toJSON(),scrollableAncestor:!!e.closest('.code-function-workbench')})),
    fonts:[...s.querySelectorAll('h2,blockquote,.definition-list-entry dt,.definition-list-entry dd')].filter(visible)
      .map(e=>({tag:e.tagName,pixels:parseFloat(getComputedStyle(e).fontSize)*(rect.width/s.offsetWidth)}))};
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--build-head", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    data = args.artifact.read_bytes()
    artifact = json.loads(data)
    report = {"head": args.build_head, "artifact_sha256": hashlib.sha256(data).hexdigest(),
              "dataset": artifact["datasetFingerprint"], "cases": [], "errors": [], "network_failures": [], "complete": False}
    atexit.register(lambda: (out / "architecture-browser.json").write_text(json.dumps(report, indent=2), encoding="utf8"))
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="msedge", headless=True)
        for width, height in [(1440, 810), (390, 844)]:
            for theme in ["dark", "light"]:
                for di, document in enumerate(artifact["sceneDocuments"]):
                    page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
                    page.on("pageerror", lambda e: report["errors"].append(str(e)))
                    page.on("requestfailed", lambda r: report["network_failures"].append({"url": r.url, "failure": r.failure}))
                    case = {"width": width, "height": height, "theme": theme, "document": document["id"], "scenes": []}
                    report["cases"].append(case)
                    page.goto(args.url + "?theme=" + theme, wait_until="networkidle")
                    page.locator('button[data-scene-document-id="' + document["id"] + '"]').click()
                    page.wait_for_selector(".slides section.present")
                    page.wait_for_load_state("networkidle")
                    chosen = {0, len(document["scenes"]) - 1}
                    for kind in ["chart", "diagram", "table", "math", "code", "prompt"]:
                        match = next((i for i, s in enumerate(document["scenes"]) if any(b["kind"] == kind for b in s["blocks"])), None)
                        if match is not None:
                            chosen.add(match)
                    for i, scene in enumerate(document["scenes"]):
                        sid = scene["id"]
                        page.evaluate("id=>document.getElementById(id).closest('.scroll-page').scrollIntoView({block:'start',behavior:'instant'})", sid)
                        page.wait_for_function("id=>document.getElementById(id)?.classList.contains('present')", arg=sid)
                        page.evaluate("document.activeElement?.blur()")
                        element = page.locator('[id="' + sid + '"]')
                        fragments = element.locator(".fragment").evaluate_all("es=>[...new Set(es.map(e=>Number(e.dataset.fragmentIndex)))].sort((a,b)=>a-b)")
                        for _ in fragments:
                            page.keyboard.press("ArrowRight")
                            page.wait_for_timeout(35)
                        assert page.locator(".slides section.present").get_attribute("id") == sid
                        measured = element.evaluate(MEASURE)
                        measured.update({"position": i + 1, "stages": len(fragments)})
                        measured["missing_resources"] = [b["source"][0]["resourceId"] for b in scene["blocks"] if b["source"][0]["resourceId"] not in measured["resources"]]
                        measured.pop("resources")
                        case["scenes"].append(measured)
                        assert not measured["missing_resources"], measured
                        assert not measured["mathErrors"] and not measured["brokenImages"], measured
                        assert all(chart["svg"] for chart in measured["charts"]), measured
                        if width == 1440 and theme == "dark":
                            measured["r_labs"] = []
                            for button in element.get_by_role("button", name="Run", exact=True).all():
                                button.click()
                                page.wait_for_function("""()=>{const s=document.querySelector('.slides section.present');return [...s.querySelectorAll('.code-run-button')].every(b=>!b.disabled)&&[...s.querySelectorAll('.code-output')].every(o=>!/Loading|Output will appear/.test(o.textContent))}""", timeout=120000)
                                output = element.locator(".code-output").all_text_contents()
                                measured["r_labs"].append(output)
                                assert all("Error:" not in text for text in output), output
                        if i in chosen:
                            image = f"level-{di}-{theme}-{width}-{i + 1:02}.png"
                            page.screenshot(path=str(out / image))
                            measured["screenshot"] = image
                    page.get_by_role("button", name="Course Overworld", exact=True).click()
                    page.wait_for_selector(".pitch-course-world-shell")
                    case["return_to_world"] = True
                    page.close()
        page = browser.new_page(java_script_enabled=False)
        page.goto(args.url + "course-runtime/static-course.html", wait_until="networkidle")
        static_ids = page.locator("article[data-pitch-step]").evaluate_all("es=>es.map(e=>e.dataset.pitchStep)")
        assert static_ids == [s["id"] for d in artifact["sceneDocuments"] for s in d["scenes"]]
        report["static_fallback"] = {"scenes": len(static_ids), "text_bytes": len(page.locator("body").inner_text())}
        page.emulate_media(media="print")
        page.pdf(path=str(out / "static-fallback.pdf"), format="A4", print_background=True)
        page.close()
        report["print"] = []
        for di, document in enumerate(artifact["sceneDocuments"]):
            page = browser.new_page(viewport={"width": 1440, "height": 810}, reduced_motion="reduce")
            page.goto(args.url + "?print-pdf&level=" + document["id"], wait_until="networkidle")
            page.wait_for_selector(".slides section")
            page.wait_for_timeout(1500)
            page.emulate_media(media="print")
            report["print"].append({"document": document["id"], "pdf_pages": page.locator(".pdf-page").count(), "sections": page.locator(".slides section").count()})
            page.pdf(path=str(out / f"level-{di}-reveal-print.pdf"), print_background=True)
            page.close()
        browser.close()
    assert not report["errors"] and not report["network_failures"], report
    report["complete"] = True
    print("Passed", sum(len(c["scenes"]) for c in report["cases"]), "scene inspections, R labs, static identities; print PDFs captured for inspection")


if __name__ == "__main__":
    main()
