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
EXPECTED_NODES = 4
EXPECTED_DOTS_MIN = 9


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


def is_fully_visible(page):
    """All visible diagram parts are immediately rendered regardless of Reveal fragment state.
    Base .d3-flow-edge and .d3-flow-node-shape are intentionally hidden in favour of
    the pixel-decoration overlay."""
    return page.evaluate("""id => {
      const scene = document.getElementById(id);
      const svg = scene.querySelector('.d3-flow-svg');
      const nodes = [...svg.querySelectorAll('.d3-flow-node')];
      const nodeLabels = [...svg.querySelectorAll('.d3-flow-node-label')];
      const edgeLabels = [...svg.querySelectorAll('.d3-flow-edge-label')];
      const paths = [...svg.querySelectorAll('.d3-flow-pixel-edge-path')];
      const pills = [...svg.querySelectorAll('.d3-flow-pixel-edge-pill')];
      const stems = [...svg.querySelectorAll('.d3-flow-pixel-edge-stem')];
      const frames = [...svg.querySelectorAll('.d3-flow-pixel-frame')];
      const connectors = [...svg.querySelectorAll('.d3-flow-pixel-connector')];
      const all = [...nodes, ...nodeLabels, ...edgeLabels, ...paths, ...pills, ...stems, ...frames, ...connectors];
      return all.every(el => {
        const style = getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        return opacity > 0.95 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    }""", SCENE)


def check_scroll_isolation(page):
    """The workflow scroll-page stays transparent and background stages remain visible."""
    backgrounds = page.evaluate("""id => [...document.querySelectorAll('.scroll-page')].map(e=>({
      coupling:!!e.querySelector(`[id="${id}"]`), color:getComputedStyle(e).backgroundColor
    }))""", SCENE)
    coupling_page = next(b for b in backgrounds if b["coupling"])
    assert coupling_page["color"] == "rgba(0, 0, 0, 0)", backgrounds
    assert sum(b["color"] != "rgba(0, 0, 0, 0)" for b in backgrounds) == 0, backgrounds
    assert page.locator('.pcd-background-stage').evaluate_all(
        "es=>es.every(e=>getComputedStyle(e).visibility==='visible')")


def validate_view(browser, url, output, theme, width, height):
    context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{url}?view=scroll&background=chemometrics-city&theme={theme}", wait_until="networkidle")
    page.evaluate("id => location.hash = '#/' + encodeURIComponent(id)", SCENE)
    page.wait_for_timeout(500)
    assert page.locator(f"{SELECTOR} .d3-flow-svg").count() == 1, "Reveal extracted SVG from its scene"
    assert page.locator(f"{SELECTOR} section").count() == 0, "Nested section becomes an unintended slide"

    # Snap to the first scroll state and verify the diagram is already complete.
    page.evaluate("""({id}) => {
      const snaps = document.getElementById(id).closest('.scroll-page').querySelectorAll('.scroll-snap-point');
      snaps[0].scrollIntoView({block:'start', behavior:'instant'});
    }""", {"id": SCENE})
    page.wait_for_timeout(300)
    assert is_fully_visible(page), f"Diagram not fully visible immediately in {theme} mode"

    check_scroll_isolation(page)
    panel = page.evaluate("id => getComputedStyle(document.getElementById(id), '::before').backgroundColor", SCENE)
    assert panel.startswith("rgba"), panel

    # Also verify at the final snap point.
    page.evaluate("""({id}) => {
      const snaps = document.getElementById(id).closest('.scroll-page').querySelectorAll('.scroll-snap-point');
      snaps[snaps.length - 1].scrollIntoView({block:'start', behavior:'instant'});
    }""", {"id": SCENE})
    page.wait_for_timeout(300)
    assert is_fully_visible(page), f"Diagram not fully visible at final snap in {theme} mode"

    geo = geometry(page)
    assert len(geo["nodes"]) == EXPECTED_NODES
    assert len(geo["dots"]) >= EXPECTED_DOTS_MIN
    page.screenshot(path=str(output / f"scroll-{theme}-{width}.png"))
    context.close()
    assert not errors, errors
    return geo


def validate_deck(browser, url, output, theme, width, height):
    context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{url}?view=deck&background=chemometrics-city&theme={theme}", wait_until="networkidle")
    page.evaluate("id => location.hash = '#/' + encodeURIComponent(id)", SCENE)
    page.wait_for_timeout(500)
    assert page.locator(f"{SELECTOR} .d3-flow-svg").count() == 1
    assert page.locator(f"{SELECTOR} section").count() == 0
    assert is_fully_visible(page), f"Deck diagram not fully visible immediately in {theme} mode"
    geo = geometry(page)
    assert len(geo["nodes"]) == EXPECTED_NODES
    assert len(geo["dots"]) >= EXPECTED_DOTS_MIN
    page.screenshot(path=str(output / f"deck-{theme}-{width}.png"))
    context.close()
    assert not errors, errors
    return geo


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173/")
    parser.add_argument("--output", type=Path, required=True, help="Existing directory for disposable screenshots")
    args = parser.parse_args()
    assert args.output.is_dir(), "Output directory must already exist"
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for width, height in ((1440, 900), (1200, 750)):
            results[str(width)] = {}
            for theme in ("light", "dark"):
                scroll_geo = validate_view(browser, args.url, args.output, theme, width, height)
                deck_geo = validate_deck(browser, args.url, args.output, theme, width, height)
                assert scroll_geo == deck_geo, f"{theme}: Deck/scroll SVG geometry or palette differs"
                results[str(width)][theme] = {"scroll": scroll_geo, "deck": deck_geo}
        browser.close()
    (args.output / "cogniflow-scroll-check.json").write_text(json.dumps(results, indent=2), encoding="utf8")
    print("PASS: immediate full diagram in light/dark scroll and deck; scene isolation; zero page errors")


if __name__ == "__main__":
    main()
