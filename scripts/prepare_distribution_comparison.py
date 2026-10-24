"""Reproduce the authored synthetic comparison snapshot; never run by the compiler.

Midpoint quantile grids (not random samples), affine-normalized to mean 50 and
sample SD 10. Decimal storage introduces <1e-10 summary error. The TriG snapshot
is the semantic source; this helper is only an authoring/verification aid.
"""
import math
from pathlib import Path
from statistics import NormalDist, mean, stdev

N = 100
TARGET = Path(__file__).resolve().parents[1] / "ontology/dataset/level4-distribution-comparison.trig"


def samples():
    p = [(i + .5) / N for i in range(N)]
    normal = NormalDist()
    raw = {
        "uniform": p,
        "normal": [normal.inv_cdf(q) for q in p],
        "skewed": [-math.log1p(-q) for q in p],
        "bimodal": [-2 + .35 * normal.inv_cdf((i + .5) / (N // 2)) for i in range(N // 2)]
                   + [2 + .35 * normal.inv_cdf((i + .5) / (N // 2)) for i in range(N // 2)],
    }
    return {key: [round(50 + 10 * (v - mean(values)) / stdev(values), 12)
                  for v in sorted(values)] for key, values in raw.items()}


def snapshot():
    labels = {"uniform": "Uniform", "normal": "Normal-like", "skewed": "Right-skewed", "bimodal": "Bimodal"}
    lines = ['@prefix cd: <https://w3id.org/project-chemie-digital/ontology/> .',
             '@prefix ex: <https://w3id.org/project-chemie-digital/resource/> .',
             '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
             '@prefix dct: <http://purl.org/dc/terms/> .',
             '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
             '# Authored synthetic snapshot; reproduce with scripts/prepare_distribution_comparison.py.',
             '<https://w3id.org/project-chemie-digital/graph/examples/level4-distribution-comparison> {']
    datasets = ', '.join('ex:l4-shapes-' + key for key in labels)
    lines += [f'  ex:l4-shapes-example a cd:WorkedExample ; skos:prefLabel "Same summaries, different empirical shapes"@en ; cd:usesDataset {datasets} ;',
              '    cd:body "Four synthetic, equally weighted sets of 100 values in arbitrary units. Deterministic midpoint quantile grids represent uniform, normal-like, strongly right-skewed (exponential) and two-mode shapes (two narrow normal-like groups). Each grid is affine-normalized as x = 50 + 10 (z - mean(z))/s(z), where s uses divisor n-1. Stored decimals reproduce mean 50 and sample SD 10 to within 1e-10. These are constructed illustrations, not random samples, real measurements or evidence of population distribution families. No fitted density is shown."@en ; dct:references ex:arithmetic-mean-formula, ex:sample-sd-formula ; cd:authoredResource true .']
    for key, values in samples().items():
        stem = 'ex:l4-shapes-' + key
        ids = ', '.join(f'{stem}-{i}' for i in range(1, N + 1))
        lines.append(f'  {stem} a cd:Dataset ; skos:prefLabel "{labels[key]} synthetic set"@en ; dct:description "Constructed quantile grid, affine-normalized to common empirical summaries; not measured data."@en ; cd:unit "a.u." ; cd:hasObservation {ids} ; cd:authoredResource true .')
        for i, value in enumerate(values, 1):
            lines.append(f'  {stem}-{i} a cd:Observation ; cd:position {i} ; cd:numericValue "{value:.12f}"^^xsd:decimal ; cd:authoredResource true .')
    for key, label, value, prop, unit in [('mean', 'Mean = 50 a.u.', 50, 'arithmetic-mean', 'a.u.'), ('sd', 'Sample SD = 10 a.u.', 10, 'sample-standard-deviation', 'a.u.'), ('variance', 'Sample variance = 100 (a.u.)²', 100, 'sample-variance', '(a.u.)^2')]:
        lines.append(f'  ex:l4-shapes-{key} a cd:StatisticalResult ; skos:prefLabel "{label}"@en ; cd:body "Common target summary; stored decimal observations agree within 1e-10."@en ; cd:usesDataset {datasets} ; cd:quantifiesProperty ex:{prop} ; cd:numericValue "{value}"^^xsd:decimal ; cd:unit "{unit}" ; cd:authoredResource true .')
    lines += ['}', '<https://w3id.org/project-chemie-digital/graph/specifications/level4-distribution-comparison> {']
    for position, (key, label) in enumerate(labels.items(), 1):
        stem = 'ex:l4-shapes-' + key
        placements = ', '.join(f'{stem}-p{i}' for i in range(1, N + 1))
        lines.append(f'  {stem}-series a cd:ObservationSeries ; skos:prefLabel "{label}"@en ; cd:position {position} ; cd:usesDataset {stem} ; cd:hasObservationPlacement {placements} ; cd:comparisonCenter ex:l4-shapes-mean ; cd:comparisonSpread ex:l4-shapes-sd ; cd:comparisonVariance ex:l4-shapes-variance ; cd:authoredResource true .')
        for i in range(1, N + 1):
            lines.append(f'  {stem}-p{i} a cd:ObservationPlacement ; cd:position {i} ; cd:targetObservation {stem}-{i} ; cd:authoredResource true .')
    return '\n'.join(lines + ['}', ''])


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Create the new authored snapshot; refuses to overwrite')
    args = parser.parse_args()
    if args.write:
        with TARGET.open('x', encoding='utf-8', newline='\n') as output:
            output.write(snapshot())
        print(f'Created {TARGET}')
    else:
        assert TARGET.read_text(encoding='utf-8') == snapshot(), 'Authored snapshot differs'
        print('Snapshot matches deterministic construction.')
