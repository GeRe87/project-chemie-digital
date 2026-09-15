"""Browser regression for CogniFlow's Reveal embedding (requires Playwright/Edge).

Start dev:cogniflow first. No fragment classes or host events are fabricated:
scroll tests drive Reveal's snap points; deck tests use its keyboard navigation.
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

SCENE = "ex:scene-cogniflow-coupling-problem--scene"
SELECTOR = f'[id="{SCENE}"]'


def wait_step(page, step):
    page.wait_for_function(
        """({id, step}) => document.getElementById(id)
          .querySelector('[data-presentation-step-count]').dataset.presentationStep === String(step)""",
        arg={"id": SCENE, "step": step},
    )


def scroll_step(page, step):
    page.evaluate("""({id, step}) => {
      const snaps = document.getElementById(id).closest('.scroll-page').querySelectorAll('.scroll-snap-point');
      if (snaps.length !== 5) throw new Error(`Expected five native scroll states, got ${snaps.length}`);
      snaps[step].scrollIntoView({block:'start', behavior:'instant'});
    }""", {"id": SCENE, "step": step})
    wait_step(page, step)


def geometry(page):
    return page.evaluate("""id => {
      const scene = document.getElementById(id), svg = scene.querySelector('.d3-flow-svg');
      const s = getComputedStyle(svg);
      return {viewBox:svg.getAttribute('viewBox'), width:s.width, height:s.height,
        orientation:svg.dataset.orientation,
        nodes:[...svg.querySelectorAll('.d3-flow-node')].map(n => ({
          id:n.dataset.nodeId, position:n.getAttribute('transform'),
          shell:n.querySelector('.d3-flow-pixel-frame-outer').getAttribute('d'),
          face:getComputedStyle(n.querySelector('.d3-flow-pixel-frame-inner')).fill,
          number:n.querySelector('.d3-flow-pixel-node-number').textContent,
          font:getComputedStyle(n.querySelector('.d3-flow-node-label')).fontSize,
          sockets:n.querySelectorAll('.d3-flow-pixel-connector').length,
          led:n.querySelector('.d3-flow-pixel-node-led').getAttribute('rx')
        })),
        pills:[...svg.querySelectorAll('.d3-flow-pixel-edge-pill')].map(e=>e.getAttribute('d')),
        dots:[...svg.querySelectorAll('.d3-flow-pixel-stem-dot')].map(e=>[e.getAttribute('x'),e.getAttribute('y')])
      };
    }""", SCENE)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173/")
    parser.add_argument("--output", type=Path, required=True, help="Existing directory for disposable screenshots")
    args = parser.parse_args()
    assert args.output.is_dir(), "Output directory must already exist"
    errors = []
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for width, height in ((1440, 900), (1200, 750)):
            views = {}
            for view in ("deck", "scroll"):
                context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"{args.url}?view={view}&background=chemometrics-city&theme=light", wait_until="networkidle")
                page.evaluate("id => location.hash = '#/' + encodeURIComponent(id)", SCENE)
                page.wait_for_timeout(500)
                assert page.locator(f"{SELECTOR} .d3-flow-svg").count() == 1, "Reveal extracted SVG from its scene"
                assert page.locator(f"{SELECTOR} section").count() == 0, "Nested section becomes an unintended slide"
                if view == "scroll":
                    # Exercise forward/backward/revisit through real scroll events.
                    for step in (0, 1, 2, 3, 4, 3, 0, 4):
                        scroll_step(page, step)
                    visible = page.locator(f"{SELECTOR} .fragment.visible").count()
                    assert visible == 4
                    page.evaluate("""id => document.getElementById(id).closest('.scroll-page')
                      .previousElementSibling.scrollIntoView({block:'start',behavior:'instant'})""", SCENE)
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(args.output / f"scroll-previous-{width}.png"))
                    scroll_step(page, 4)
                    page.evaluate("""id => document.getElementById(id).closest('.scroll-page')
                      .nextElementSibling.scrollIntoView({block:'start',behavior:'instant'})""", SCENE)
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(args.output / f"scroll-next-{width}.png"))
                    scroll_step(page, 4)
                    backgrounds = page.evaluate("""id => [...document.querySelectorAll('.scroll-page')].map(e=>({
                      coupling:!!e.querySelector(`[id="${id}"]`), color:getComputedStyle(e).backgroundColor
                    }))""", SCENE)
                    assert sum(b["color"] == "rgb(248, 252, 249)" for b in backgrounds) == 1, backgrounds
                    assert next(b for b in backgrounds if b["coupling"])["color"] == "rgb(248, 252, 249)"
                    assert page.locator('.pcd-background-stage').evaluate_all("es=>es.every(e=>getComputedStyle(e).visibility==='visible')")
                else:
                    wait_step(page, 0)
                    for step in range(1, 5):
                        page.keyboard.press("ArrowRight")
                        wait_step(page, step)
                page.wait_for_timeout(300)
                views[view] = geometry(page)
                assert len(views[view]["nodes"]) == 5
                assert len(views[view]["dots"]) == 15
                assert page.locator(f"{SELECTOR} .d3-flow-node").evaluate_all("es=>es.every(e=>getComputedStyle(e).opacity==='1')")
                page.screenshot(path=str(args.output / f"{view}-accepted-{width}.png"))
                context.close()
            assert views["scroll"] == views["deck"], "Deck/scroll SVG geometry or palette differs"
            results[str(width)] = views
        browser.close()
    assert not errors, errors
    (args.output / "cogniflow-scroll-check.json").write_text(json.dumps(results, indent=2), encoding="utf8")
    print("PASS: identical deck/scroll geometry at 1440/1200; native steps 0..4, reverse/revisit; scene-local canvas; zero page errors")


if __name__ == "__main__":
    main()
