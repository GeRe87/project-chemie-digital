"""Browser regression for rendered flow diagrams in Reveal (requires Playwright/Edge).

Start the target pitch dev server first. The check uses real Reveal scroll/deck
navigation and never fabricates fragment classes or host events.

By default the first scene using the generic diagram-stage layout is checked.
Pass --scene-id to select any other rendered flow-diagram scene explicitly.
Optional node/dot expectations are content-regression assertions supplied by the
caller; the script itself contains no presentation-specific resource identity.
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


def resolve_scene_id(page, requested_scene_id):
    if requested_scene_id:
        exists = page.evaluate(
            "id => document.getElementById(id) !== null",
            requested_scene_id,
        )
        if not exists:
            raise AssertionError(f"Scene not found: {requested_scene_id}")
        return requested_scene_id

    scene_id = page.evaluate("""() => {
      const preferred = document.querySelector('section[data-layout="diagram-stage"] .d3-flow-svg');
      const fallback = document.querySelector('section .d3-flow-svg');
      const scene = (preferred ?? fallback)?.closest('section[id]');
      return scene?.id ?? null;
    }""")
    if not scene_id:
        raise AssertionError("No rendered flow-diagram scene found")
    return scene_id


def selector(scene_id):
    return f'[id="{scene_id}"]'


def geometry(page, scene_id):
    return page.evaluate("""id => {
      const scene = document.getElementById(id), svg = scene.querySelector('.d3-flow-svg');
      const s = getComputedStyle(svg);
      return {viewBox:svg.getAttribute('viewBox'), width:s.width, height:s.height,
        orientation:svg.dataset.orientation,
        nodes:[...svg.querySelectorAll('.d3-flow-node')].map(n => ({
          id:n.dataset.nodeId, position:n.getAttribute('transform'),
          label:n.querySelector('.d3-flow-node-label, .d3-flow-node-title')?.textContent ?? '',
          shell:n.querySelector('.d3-flow-pixel-frame-outer')?.getAttribute('d') ?? null,
          face:n.querySelector('.d3-flow-pixel-frame-inner')
            ? getComputedStyle(n.querySelector('.d3-flow-pixel-frame-inner')).fill
            : null,
          number:n.querySelector('.d3-flow-pixel-node-number')?.textContent ?? null,
          font:n.querySelector('.d3-flow-node-label, .d3-flow-node-title')
            ? getComputedStyle(n.querySelector('.d3-flow-node-label, .d3-flow-node-title')).fontSize
            : null,
          sockets:n.querySelectorAll('.d3-flow-pixel-connector').length,
          led:n.querySelector('.d3-flow-pixel-node-led')?.getAttribute('rx') ?? null
        })),
        pills:[...svg.querySelectorAll('.d3-flow-pixel-edge-pill')].map(e=>e.getAttribute('d')),
        dots:[...svg.querySelectorAll('.d3-flow-pixel-stem-dot')].map(e=>[e.getAttribute('x'),e.getAttribute('y')]),
        edges:svg.querySelectorAll('.d3-flow-edge, .d3-flow-pixel-edge-path').length
      };
    }""", scene_id)


def is_fully_visible(page, scene_id):
    """All visible diagram nodes and labels are immediately rendered."""
    return page.evaluate("""id => {
      const scene = document.getElementById(id);
      const svg = scene.querySelector('.d3-flow-svg');
      const nodes = [...svg.querySelectorAll('.d3-flow-node')];
      const nodeLabels = [...svg.querySelectorAll('.d3-flow-node-label, .d3-flow-node-title, .d3-flow-node-body')];
      const edgeLabels = [...svg.querySelectorAll('.d3-flow-edge-label')];
      const all = [...nodes, ...nodeLabels, ...edgeLabels];
      return all.length > 0 && all.every(el => {
        const style = getComputedStyle(el);
        const opacity = parseFloat(style.opacity || '1');
        return opacity > 0.95 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    }""", scene_id)


def check_scroll_isolation(page, scene_id):
    """The active scroll-page stays transparent and background stages remain visible."""
    backgrounds = page.evaluate("""id => [...document.querySelectorAll('.scroll-page')].map(e=>({
      selected:!!e.querySelector('[id="' + CSS.escape(id) + '"]'),
      color:getComputedStyle(e).backgroundColor
    }))""", scene_id)
    selected_page = next(b for b in backgrounds if b["selected"])
    assert selected_page["color"] == "rgba(0, 0, 0, 0)", backgrounds
    assert sum(b["color"] != "rgba(0, 0, 0, 0)" for b in backgrounds) == 0, backgrounds
    assert page.locator('.pcd-background-stage').evaluate_all(
        "es=>es.every(e=>getComputedStyle(e).visibility==='visible')")


def assert_geometry_expectations(geo, expected_nodes, expected_dots_min):
    if expected_nodes is not None:
        assert len(geo["nodes"]) == expected_nodes, geo
    if expected_dots_min is not None:
        assert len(geo["dots"]) >= expected_dots_min, geo


def validate_view(browser, url, output, theme, width, height, requested_scene_id, expected_nodes, expected_dots_min):
    context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{url}?view=scroll&background=chemometrics-city&theme={theme}", wait_until="networkidle")
    scene_id = resolve_scene_id(page, requested_scene_id)
    scene_selector = selector(scene_id)
    page.evaluate("id => location.hash = '#/' + encodeURIComponent(id)", scene_id)
    page.wait_for_timeout(500)
    assert page.locator(f"{scene_selector} .d3-flow-svg").count() == 1, "Reveal extracted SVG from its scene"
    assert page.locator(f"{scene_selector} section").count() == 0, "Nested section becomes an unintended slide"

    page.evaluate("""id => {
      const snaps = document.getElementById(id).closest('.scroll-page').querySelectorAll('.scroll-snap-point');
      snaps[0].scrollIntoView({block:'start', behavior:'instant'});
    }""", scene_id)
    page.wait_for_timeout(300)
    assert is_fully_visible(page, scene_id), f"Diagram not fully visible immediately in {theme} mode"

    check_scroll_isolation(page, scene_id)
    panel = page.evaluate("id => getComputedStyle(document.getElementById(id), '::before').backgroundColor", scene_id)
    assert panel.startswith("rgba"), panel

    page.evaluate("""id => {
      const snaps = document.getElementById(id).closest('.scroll-page').querySelectorAll('.scroll-snap-point');
      snaps[snaps.length - 1].scrollIntoView({block:'start', behavior:'instant'});
    }""", scene_id)
    page.wait_for_timeout(300)
    assert is_fully_visible(page, scene_id), f"Diagram not fully visible at final snap in {theme} mode"

    geo = geometry(page, scene_id)
    assert_geometry_expectations(geo, expected_nodes, expected_dots_min)
    page.screenshot(path=str(output / f"scroll-{theme}-{width}.png"))
    context.close()
    assert not errors, errors
    return scene_id, geo


def validate_deck(browser, url, output, theme, width, height, requested_scene_id, expected_nodes, expected_dots_min):
    context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{url}?view=deck&background=chemometrics-city&theme={theme}", wait_until="networkidle")
    scene_id = resolve_scene_id(page, requested_scene_id)
    scene_selector = selector(scene_id)
    page.evaluate("id => location.hash = '#/' + encodeURIComponent(id)", scene_id)
    page.wait_for_timeout(500)
    assert page.locator(f"{scene_selector} .d3-flow-svg").count() == 1
    assert page.locator(f"{scene_selector} section").count() == 0
    assert is_fully_visible(page, scene_id), f"Deck diagram not fully visible immediately in {theme} mode"
    geo = geometry(page, scene_id)
    assert_geometry_expectations(geo, expected_nodes, expected_dots_min)
    page.screenshot(path=str(output / f"deck-{theme}-{width}.png"))
    context.close()
    assert not errors, errors
    return scene_id, geo


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173/")
    parser.add_argument("--output", type=Path, required=True, help="Existing directory for disposable screenshots")
    parser.add_argument("--scene-id", help="Optional explicit rendered scene id")
    parser.add_argument("--expected-nodes", type=int, help="Optional exact node-count assertion")
    parser.add_argument("--expected-dots-min", type=int, help="Optional minimum pixel stem-dot assertion")
    args = parser.parse_args()
    assert args.output.is_dir(), "Output directory must already exist"

    results = {}
    selected_scene_id = None
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for width, height in ((1440, 900), (1200, 750)):
            results[str(width)] = {}
            for theme in ("light", "dark"):
                scroll_scene_id, scroll_geo = validate_view(
                    browser, args.url, args.output, theme, width, height,
                    args.scene_id, args.expected_nodes, args.expected_dots_min,
                )
                deck_scene_id, deck_geo = validate_deck(
                    browser, args.url, args.output, theme, width, height,
                    args.scene_id or scroll_scene_id, args.expected_nodes, args.expected_dots_min,
                )
                assert scroll_scene_id == deck_scene_id
                assert scroll_geo == deck_geo, f"{theme}: Deck/scroll SVG geometry or palette differs"
                selected_scene_id = scroll_scene_id
                results[str(width)][theme] = {"scroll": scroll_geo, "deck": deck_geo}
        browser.close()

    payload = {"sceneId": selected_scene_id, "results": results}
    (args.output / "presentation-diagram-check.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf8",
    )
    print(f"PASS: {selected_scene_id}; light/dark scroll and deck; scene isolation; zero page errors")


if __name__ == "__main__":
    main()
