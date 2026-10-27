"""Deterministic original teaching SVGs. Scientific coordinates come from TriG."""
from __future__ import annotations

import argparse
import html
from pathlib import Path

from rdflib import Dataset, Namespace

ROOT = Path(__file__).resolve().parents[1]
CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")


def text(x, y, value, size=22, anchor="middle"):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{html.escape(value)}</text>'


def svg(body, label, width=1280, height=480):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">'
            f'<title id="title">{html.escape(label)}</title>'
            '<style>text{font-family:system-ui,sans-serif;fill:var(--pcd-foreground,#e8f1ff)}'
            '.axis{stroke:var(--pcd-foreground,#b8cce8);stroke-width:2;fill:none}'
            '.panel{fill:var(--pcd-surface,#14233b);stroke:#507293;stroke-width:2}'
            '.accent{stroke:#38bde8;stroke-width:4;fill:none}</style>'
            f'{body}</svg>\n')


def data():
    dataset = Dataset(default_union=True)
    for name in ("talks-ted-calibration.trig", "talks-ted-revisions.trig"):
        dataset.parse(ROOT / "ontology/dataset" / name, format="trig")
    return dataset


def pairs(dataset, owner):
    points = sorted(dataset.objects(owner, CD.hasObservation), key=lambda p: int(dataset.value(p, CD.position)))
    return [(float(dataset.value(p, CD.xValue)), float(dataset.value(p, CD.numericValue))) for p in points]


def fit(points):
    xm = sum(x for x, _ in points) / len(points)
    ym = sum(y for _, y in points) / len(points)
    slope = sum((x-xm)*(y-ym) for x, y in points) / sum((x-xm)**2 for x, _ in points)
    intercept = ym-slope*xm
    r2 = 1-sum((y-intercept-slope*x)**2 for x, y in points)/sum((y-ym)**2 for _, y in points)
    return intercept, slope, r2


def scatter(points, offset, heading, x_label, y_label):
    left, right, top, bottom = offset+105, offset+585, 220, 455
    xmax = max(x for x, _ in points)*1.1
    ymax = max(y for _, y in points)*1.15
    x = lambda v: left+(right-left)*v/xmax
    y = lambda v: bottom-(bottom-top)*v/ymax
    a, b, _ = fit(points)
    body = f'<rect class="panel" x="{offset+20}" y="165" width="600" height="350" rx="16"/>'
    body += text(offset+320, 199, heading, 23)
    body += f'<path class="axis" d="M{left} {top}V{bottom}H{right}"/>'
    for i in range(4):
        xx, yy = xmax*i/3, ymax*i/3
        body += text(round(x(xx), 2), bottom+24, f'{xx:.0f}', 16)
        body += text(left-10, round(y(yy)+5, 2), f'{yy:.0f}', 16, 'end')
    lo, hi = min(v[0] for v in points), max(v[0] for v in points)
    body += f'<path class="accent" d="M{x(lo):.3f} {y(a+b*lo):.3f}L{x(hi):.3f} {y(a+b*hi):.3f}"/>'
    for xx, yy in points:
        body += f'<circle cx="{x(xx):.3f}" cy="{y(yy):.3f}" r="7" fill="#ffba64" stroke="#101c30" stroke-width="2"/>'
    body += text((left+right)/2, 502, x_label, 18)
    body += f'<text transform="translate({offset+42} 345) rotate(-90)" text-anchor="middle" font-size="18">{html.escape(y_label)}</text>'
    return body


def variance(dataset):
    # Predeclared selection rule: second non-overlapping five-point display block.
    measured = pairs(dataset, EX['ted-calibration-pairs'])[5:10]
    artificial = pairs(dataset, EX['ted-uv-comparison-data'])
    assert round(fit(measured)[2], 3) == 0.741
    assert round(fit(artificial)[2], 3) == 0.990
    body = ''
    steps = ['Decompose', 'Cool', 'Capture', 'Desorb', 'Refocus', 'Heat / inject']
    for i, step in enumerate(steps):
        xx = 18+i*210
        body += f'<rect class="panel" x="{xx}" y="22" width="192" height="80" rx="12"/>'
        body += text(xx+96, 57, step, 22)
        body += text(xx+96, 84, ['TGA','Gas stream','Twister + transfer','Thermal release','Cold inlet','GC-MS'][i], 17)
        if i < 5: body += text(xx+201, 70, '→', 23)
    body += text(640, 139, 'Every transfer and temperature change can add variability', 23)
    body += scatter(measured, 0, 'Supplied SBR standards 6–10', 'Polymer mass (µg)', 'Marker area (source units)')
    body += scatter(artificial, 640, 'Artificial UV-visible comparison', 'Concentration (arbitrary units)', 'Absorbance (dimensionless)')
    body += text(640, 546, 'Selected illustration, not a universal performance comparison or an uncertainty budget', 20)
    return svg(body, 'Process-chain variability and two distinct calibration examples', height=565)


def computer(x, y):
    return (f'<rect class="panel" x="{x}" y="{y}" width="170" height="95" rx="8"/>'
            f'<path class="axis" d="M{x+85} {y+95}v20m-40 0h80"/>'
            f'<path class="accent" d="M{x+32} {y+36}l-15 12 15 12m106-24 15 12-15 12m-58-20-15 44"/>')


def fair():
    body = ''
    for offset, heading in [(0, 'Compatible but unstandardized'), (640, 'Standardized semantics')]:
        body += f'<rect class="panel" x="{offset+10}" y="10" width="620" height="270" rx="16"/>'
        body += text(offset+320, 47, heading, 25)
        body += text(offset+120, 86, 'Can read', 20)+text(offset+120, 110, 'Can understand', 20)
        body += text(offset+520, 86, 'Can read', 20)+text(offset+520, 110, 'Cannot understand' if offset == 0 else 'Can understand', 20)
        body += computer(offset+35, 139)+computer(offset+435, 139)
        body += text(offset+320, 213, '→', 55)
        body += f'<path class="axis" d="M{offset+299} 112h32l13 13v34h-45zM{offset+331} 112v13h13"/>'
        body += text(offset+320, 181, 'Data', 18)
    return svg(body, 'Readable files versus shared machine-interpretable meaning', height=292)


def spectrum():
    # Anonymous, explicitly synthetic ion-channel pattern, not a named compound.
    body = '<rect x="2" y="2" width="636" height="264" rx="12" fill="#14233b" stroke="#507293" stroke-width="2"/>'
    body += text(320, 30, 'Synthetic candidate ↔ reference', 21)
    body += '<path class="axis" d="M80 128H600"/>'
    for i, (candidate, reference) in enumerate([(0.35,0.32),(1.0,1.0),(0.18,0.20),(0.6,0.58),(0.12,0.10)]):
        xx = 150+i*95
        body += f'<path d="M{xx} 128v{-candidate*70}" stroke="#38bde8" stroke-width="6"/>'
        body += f'<path d="M{xx} 128v{reference*70}" stroke="#ffba64" stroke-width="6"/>'
        body += text(xx, 228, str(i+1), 16)
    body += text(25, 88, 'C', 18)+text(25, 179, 'R', 18)
    body += text(320, 253, 'C: candidate · R: reference · numbered anonymous ion channels', 16)
    return svg(body, 'Synthetic mirror-spectrum illustration, not an identification result', width=640, height=270)


def assets():
    dataset = data()
    return {'ted-variance-comparison.svg': variance(dataset), 'ted-fair-compatibility.svg': fair(), 'ted-marker-spectrum.svg': spectrum()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for name, content in assets().items():
        path = ROOT / 'apps/pitch/public/talks-media' / name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != content:
                raise ValueError(f'Generated teaching asset is stale: {name}')
        else:
            path.write_text(content, encoding='utf-8', newline='\n')
        print(('Checked ' if args.check else 'Generated ') + name)


if __name__ == '__main__':
    main()
