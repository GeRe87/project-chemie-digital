from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402
import rdf_dataset as RDF_DATASET  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
CONTENT_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics")
SCENE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-mean-values-lecture")
PATH = EX["path-chemometrics-mean-values-lecture"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture")

OWNER_SPECS = {
    "arithmetic-mean-applicability-interpretation": {
        "body": "The arithmetic mean is defined for numerical data for which addition and division by the number of observations are meaningful; normality is not a prerequisite for computing it. Its usefulness as a representative center can be reduced by strong skewness or extreme observations.",
        "points": (
            "The arithmetic mean can be computed for numerical data when addition and division by the number of observations are meaningful; normality is not required.",
            "Strong skewness or extreme observations can reduce how representative the arithmetic mean is as a center.",
        ),
    },
    "def-expected-value": {
        "body": "The expected value of an integrable random variable is the probability-weighted average defined by its probability distribution. It is a property of that distribution, not the arithmetic mean of one particular observed sample.",
        "points": (
            "Expected value is the probability-weighted average defined by an integrable random variable's probability distribution.",
            "It is a property of the distribution, not the arithmetic mean of one observed sample.",
        ),
    },
    "sample-mean-estimator-interpretation": {
        "body": "The sample arithmetic mean is a statistic computed from observed data and can be used to estimate a population expected value under an appropriate sampling model. It is not semantically identical to the expected value of a random variable.",
        "points": (
            "The sample arithmetic mean is a statistic computed from observed data.",
            "Under an appropriate sampling model it can estimate a population expected value, but it is not semantically identical to that expected value.",
        ),
    },
    "def-law-of-large-numbers": {
        "body": "Under standard conditions such as independent identically distributed observations with a finite expected absolute value, the sample arithmetic mean converges to the expected value as the sample size grows.",
        "points": (
            "For independent identically distributed observations with a finite expected absolute value, the sample arithmetic mean converges to the expected value as sample size grows.",
        ),
    },
    "lln-not-standard-error-interpretation": {
        "body": "The law of large numbers concerns convergence of sample averages. The formula for the standard error of a sample mean and the approximate normal shape of its sampling distribution are separate sampling-distribution results and must not be used as the definition of the law of large numbers.",
        "points": (
            "The law of large numbers concerns convergence of sample averages.",
            "Standard-error formulas and approximate normal sampling distributions are separate results, not definitions of the law of large numbers.",
        ),
    },
    "def-geometric-mean": {
        "body": "For n strictly positive observations, the geometric mean is the nth root of their product, equivalently the exponential of the arithmetic mean of their logarithms.",
        "points": (
            "For strictly positive observations, the geometric mean is the nth root of their product.",
            "Equivalently, it is the exponential of the arithmetic mean of their logarithms.",
        ),
    },
    "geometric-mean-applicability-interpretation": {
        "body": "The geometric mean is appropriate for strictly positive quantities when equal weighting on a logarithmic scale is scientifically meaningful, for example multiplicative factors or ratios. It is not a universal replacement for the arithmetic mean for every quantity described as a rate.",
        "points": (
            "The geometric mean is appropriate for strictly positive quantities when equal weighting on a logarithmic scale is scientifically meaningful.",
            "It suits multiplicative factors or ratios but is not a universal replacement for the arithmetic mean for every rate.",
        ),
    },
    "def-harmonic-mean": {
        "body": "For n nonzero observations whose reciprocal sum is nonzero, the harmonic mean is n divided by the sum of their reciprocals. In common rate applications the values are positive.",
        "points": (
            "For nonzero observations with a nonzero reciprocal sum, the harmonic mean is n divided by the sum of their reciprocals.",
            "Common rate applications use positive values.",
        ),
    },
    "harmonic-mean-rate-interpretation": {
        "body": "For positive rates applied over equal distances or, more generally, equal quantities in the rate denominator, the harmonic mean gives the overall average rate because the corresponding times or reciprocal contributions add. Equal time intervals instead lead to an arithmetic mean of the rates.",
        "points": (
            "For positive rates over equal distances or equal quantities in the rate denominator, the harmonic mean gives the overall average rate.",
            "For equal time intervals, the arithmetic mean of the rates applies instead.",
        ),
    },
    "def-median": {
        "body": "A median is a central value such that at least half of the observations are no greater and at least half are no smaller. For a finite ordered sample, the conventional sample median is the middle order statistic for odd n and the arithmetic mean of the two middle order statistics for even n.",
        "points": (
            "A median is a central value with at least half of the observations no greater and at least half no smaller.",
            "For an ordered finite sample, use the middle order statistic for odd n and the arithmetic mean of the two middle order statistics for even n.",
        ),
    },
    "median-robustness-interpretation": {
        "body": "Because the sample median depends on order rather than the magnitudes of all observations, it is substantially less sensitive to extreme values than the arithmetic mean. It is robust to outliers, but extreme observations are not guaranteed to have no effect in every dataset.",
        "points": (
            "The sample median depends on order and is substantially less sensitive to extreme values than the arithmetic mean.",
            "It is robust to outliers, but extreme observations are not guaranteed to have no effect in every dataset.",
        ),
    },
}

SCENE_ITEM_BY_OWNER = {
    "arithmetic-mean-applicability-interpretation": "scene-item-chemometrics-mean-values-arithmetic-mean-interpretation",
    "def-expected-value": "scene-item-chemometrics-mean-values-expected-value-definition",
    "sample-mean-estimator-interpretation": "scene-item-chemometrics-mean-values-expected-value-interpretation",
    "def-law-of-large-numbers": "scene-item-chemometrics-mean-values-law-of-large-numbers-definition",
    "lln-not-standard-error-interpretation": "scene-item-chemometrics-mean-values-law-of-large-numbers-interpretation",
    "def-geometric-mean": "scene-item-chemometrics-mean-values-geometric-mean-definition",
    "geometric-mean-applicability-interpretation": "scene-item-chemometrics-mean-values-geometric-mean-interpretation",
    "def-harmonic-mean": "scene-item-chemometrics-mean-values-harmonic-mean-definition",
    "harmonic-mean-rate-interpretation": "scene-item-chemometrics-mean-values-harmonic-mean-interpretation",
    "def-median": "scene-item-chemometrics-mean-values-median-definition",
    "median-robustness-interpretation": "scene-item-chemometrics-mean-values-median-interpretation",
}


def mean_values_request():
    return RUNTIME.CourseUnitPathSelectionRequest(
        offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
        placement_id=str(EX["unit-placement-chemometrics-mean-values"]),
        unit_id=str(EX["learning-unit-mean-values"]),
        requested_path_id=str(PATH),
        requested_path_graph_id=str(PATH_GRAPH),
    )


class ChemometricsMeanValuesKeyPointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.artifact = RUNTIME.build_artifact(mean_values_request())
        cls.document = cls.artifact["sceneDocuments"][0]
        cls.entities = {
            entity["id"]: entity
            for entity in cls.artifact["datasetSnapshot"]["entities"]
        }

    def test_exactly_the_eleven_mean_values_owners_gain_keypoints(self) -> None:
        owners = {
            str(subject).removeprefix(str(EX))
            for subject in self.content_graph.subjects(CD.hasKeyPoint, None)
        }
        self.assertEqual(set(OWNER_SPECS), owners)

    def test_owner_bodies_remain_exact_and_keypoints_are_source_linked_and_contiguous(self) -> None:
        for owner_id, spec in OWNER_SPECS.items():
            with self.subTest(owner=owner_id):
                owner = EX[owner_id]
                self.assertEqual(
                    {Literal(spec["body"], lang="en")},
                    set(self.content_graph.objects(owner, CD.body)),
                )
                linked = sorted(
                    self.content_graph.objects(owner, CD.hasKeyPoint),
                    key=lambda point: int(next(self.content_graph.objects(point, CD.position))),
                )
                expected_ids = [
                    EX[f"{owner_id}-keypoint-{position}"]
                    for position in range(1, len(spec["points"]) + 1)
                ]
                self.assertEqual(expected_ids, linked)
                for position, (point, text) in enumerate(zip(linked, spec["points"], strict=True), start=1):
                    self.assertEqual({CD.KeyPoint}, set(self.content_graph.objects(point, RDF.type)))
                    self.assertEqual({Literal(position)}, set(self.content_graph.objects(point, CD.position)))
                    self.assertEqual({Literal(text, lang="en")}, set(self.content_graph.objects(point, CD.body)))
                    self.assertEqual({Literal(True)}, set(self.content_graph.objects(point, CD.authoredResource)))
                    self.assertEqual({owner}, set(self.content_graph.subjects(CD.hasKeyPoint, point)))

    def test_exactly_the_target_scene_items_use_keypoint_role_and_selector(self) -> None:
        actual_items = set(self.scene_graph.subjects(CD.communicativeRole, CD.KeyPointRole))
        expected_items = {EX[item_id] for item_id in SCENE_ITEM_BY_OWNER.values()}
        self.assertEqual(expected_items, actual_items)
        for owner_id, item_id in SCENE_ITEM_BY_OWNER.items():
            with self.subTest(owner=owner_id):
                scene_item = EX[item_id]
                self.assertEqual({EX[owner_id]}, set(self.scene_graph.objects(scene_item, CD.selectsResource)))
                self.assertEqual({Literal("cd:hasKeyPoint")}, set(self.scene_graph.objects(scene_item, CD.selectionPath)))
                self.assertEqual({Literal("en")}, set(self.scene_graph.objects(scene_item, CD.language)))
                self.assertEqual({Literal(True)}, set(self.scene_graph.objects(scene_item, CD.authoredResource)))

    def test_runtime_uses_keypoint_lists_while_snapshot_retains_detailed_owner_prose(self) -> None:
        list_blocks = {
            block["source"][0]["resourceId"]: block
            for scene in self.document["scenes"]
            for block in scene["blocks"]
            if block["kind"] == "list"
            and block["source"]
            and block["source"][0]["resourceId"].removeprefix("ex:") in OWNER_SPECS
        }
        self.assertEqual({f"ex:{owner_id}" for owner_id in OWNER_SPECS}, set(list_blocks))

        for owner_id, spec in OWNER_SPECS.items():
            with self.subTest(owner=owner_id):
                owner_resource_id = f"ex:{owner_id}"
                block = list_blocks[owner_resource_id]
                self.assertEqual("unordered", block["listStyle"])
                self.assertEqual("cd:hasKeyPoint", block["source"][0]["relationPath"])
                self.assertEqual(list(spec["points"]), [item["text"] for item in block["items"]])
                self.assertEqual(
                    [f"ex:{owner_id}-keypoint-{position}" for position in range(1, len(spec["points"]) + 1)],
                    [item["source"][0]["resourceId"] for item in block["items"]],
                )
                self.assertTrue(all(item["source"][0]["relationPath"] == "cd:body" for item in block["items"]))
                self.assertEqual(spec["body"], self.entities[owner_resource_id]["description"])
                self.assertNotIn(spec["body"], [item["text"] for item in block["items"]])


if __name__ == "__main__":
    unittest.main()
