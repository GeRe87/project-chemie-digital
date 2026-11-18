"""Reproduce the fitted-normal KS teaching values with refitted simulations."""
import math
import random
import re
from rdflib import Namespace
from rdf_dataset import ROOT, assemble_dataset

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")


def residuals(groups):
    return [value - sum(group) / len(group) for group in groups for value in group]


def fitted_normal_distance(values):
    count = len(values)
    mean = sum(values) / count
    sd = math.sqrt(sum((value - mean) ** 2 for value in values) / (count - 1))
    probabilities = [(1 + math.erf((value - mean) / sd / math.sqrt(2))) / 2 for value in sorted(values)]
    return max(max((index + 1) / count - probability, probability - index / count)
               for index, probability in enumerate(probabilities))


def main():
    dataset = assemble_dataset()
    groups = []
    for method in "ABC":
        observations = sorted({obj for _, _, obj, _ in dataset.quads(
            (EX["l7-spe-R-" + method], CD.hasObservation, None, None))}, key=str)
        group = []
        for observation in observations:
            value, = {obj for _, _, obj, _ in dataset.quads((observation, CD.numericValue, None, None))}
            group.append(float(value))
        if len(group) != 6:
            raise ValueError("Expected six independent recoveries per river-water method")
        groups.append(group)
    observed = [fitted_normal_distance(residuals(groups)),
                fitted_normal_distance([-10, -4, -1, -.8, -.6, -.3, .3, .6, .8, 1, 4, 10])]
    rng = random.Random(721)
    draws = 99_999
    exceedances = [0, 0]
    for _ in range(draws):
        # The river observations are rounded to 0.01 percentage points. Refit
        # all three method means before refitting the normal residual model.
        simulated = [[round(94 + rng.gauss(0, math.sqrt(2)), 2) for _ in range(6)] for _ in range(3)]
        exceedances[0] += fitted_normal_distance(residuals(simulated)) >= observed[0]
    for _ in range(draws):
        exceedances[1] += fitted_normal_distance([rng.gauss(0, 1) for _ in range(12)]) >= observed[1]
    probabilities = [(value + 1) / (draws + 1) for value in exceedances]
    graphic = (ROOT / "apps/pitch/public/chemometrics/level7-anova-21.svg").read_text(encoding="utf-8")
    shown_distances = [float(value) for value in re.findall(r">D = ([0-9.]+)</text>", graphic)]
    shown_probabilities = [float(value) for value in re.findall(r">Fit-adjusted p ≈ ([0-9.]+)</text>", graphic)]
    if len(shown_distances) != 2 or len(shown_probabilities) != 2:
        raise ValueError("Expected both fitted KS examples in the teaching graphic")
    for label, distance, probability, shown_d, shown_p in zip(
        ("River residuals", "Heavy-tail example"), observed, probabilities, shown_distances, shown_probabilities
    ):
        print(f"{label}: D = {distance:.6f}, refitted Monte Carlo p = {probability:.5f}")
        if abs(distance - shown_d) > .0005 or abs(probability - shown_p) > .0015:
            raise ValueError("Teaching value differs from refitted calibration")


if __name__ == "__main__":
    main()
