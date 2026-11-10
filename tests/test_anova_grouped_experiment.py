"""Focused compiler and SHACL coverage for authored grouped ANOVA."""
import json
import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Dataset, Graph, Literal, Namespace
from rdflib.namespace import RDF, SKOS, XSD

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from generate_canonical_runtime import (
    CoursePathReference,
    chart_payload,
    compact,
    compile_scene_document,
    promote_document_version,
)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://example.test/authored/")
DCT = Namespace("http://purl.org/dc/terms/")


def decimal(value):
    return Literal(str(value), datatype=XSD.decimal)


def fixture(group_count=2, observations_per_group=2):
    dataset = Dataset(default_union=True)
    graph = dataset.graph(EX.named_graph)
    graph.add((EX.chart, RDF.type, CD.ChartDefinition))
    graph.add((EX.chart, CD.authoredResource, Literal(True)))
    graph.add((EX.chart, CD.chartType, CD.ScientificExperiment))
    graph.add((EX.chart, CD.experimentKind, Literal("anova-one-way")))
    graph.add((EX.chart, SKOS.prefLabel, Literal("Observed responses", lang="en")))
    graph.add((EX.chart, CD.body, Literal("Compare authored response groups.", lang="en")))
    graph.add((EX.chart, CD.xAxisLabel, Literal("Treatment", lang="en")))
    graph.add((EX.chart, CD.yAxisLabel, Literal("Response", lang="en")))
    graph.add((EX.chart, CD.yAxisUnit, Literal("mg/L")))
    graph.add((EX.chart, CD.differenceUnit, Literal("mg/L difference")))
    for position, key in enumerate(("betweenScale", "withinScale", "view"), 1):
        resource = EX[f"control-{position}"]
        graph.add((EX.chart, CD.hasExperimentParameter, resource))
        graph.add((resource, RDF.type, CD.ExperimentParameter))
        graph.add((resource, CD.authoredResource, Literal(True)))
        graph.add((resource, CD.position, Literal(position)))
        graph.add((resource, CD.parameterKey, Literal(key)))
        graph.add((resource, SKOS.prefLabel, Literal(key, lang="en")))
        graph.add((resource, CD.numericValue, decimal(0 if key == "view" else 1)))
        graph.add((resource, CD.parameterMinimum, decimal(0)))
        graph.add((resource, CD.parameterMaximum, decimal(2)))
        graph.add((resource, CD.parameterStep, decimal(1)))
        graph.add((resource, CD.adjustableParameter, Literal(True)))
    # Deliberately reverse insertion order. Identity and order come from RDF.
    for position in reversed(range(1, group_count + 1)):
        group = EX[f"arm-{position}"]
        data = EX[f"measurements-{position}"]
        graph.add((EX.chart, CD.hasChartGroup, group))
        graph.add((group, RDF.type, CD.ChartGroup))
        graph.add((group, CD.authoredResource, Literal(True)))
        graph.add((group, CD.position, Literal(position)))
        graph.add((group, SKOS.prefLabel, Literal(f"Authored arm {position}", lang="en")))
        graph.add((group, CD.usesDataset, data))
        graph.add((data, RDF.type, CD.Dataset))
        graph.add((data, CD.authoredResource, Literal(True)))
        graph.add((data, CD.unit, Literal("mg/L")))
        for index in reversed(range(1, observations_per_group + 1)):
            observation = EX[f"reading-{position}-{index}"]
            graph.add((data, CD.hasObservation, observation))
            graph.add((observation, RDF.type, CD.Observation))
            graph.add((observation, CD.authoredResource, Literal(True)))
            graph.add((observation, CD.position, Literal(index)))
            graph.add((observation, CD.numericValue, decimal((position - 1) * 4 + index * 2 - 1)))
    return dataset, graph


def scene_path_fixture(graph):
    graph.add((EX.path, RDF.type, CD.LearningPath))
    graph.add((EX.path, CD.hasStep, EX.step))
    graph.add((EX.step, CD.position, Literal(1)))
    graph.add((EX.step, CD.usesScene, EX.scene))
    graph.add((EX.scene, RDF.type, CD.Scene))
    graph.add((EX.scene, CD.focusConcept, EX.concept))
    graph.add((EX.concept, RDF.type, SKOS.Concept))
    graph.add((EX.concept, CD.authoredResource, Literal(True)))
    graph.add((EX.concept, SKOS.prefLabel, Literal("Response comparison", lang="en")))
    graph.add((EX.scene, CD.hasSceneItem, EX.item))
    graph.add((EX.item, RDF.type, CD.SceneItem))
    graph.add((EX.item, CD.position, Literal(1)))
    graph.add((EX.item, CD.selectsResource, EX.chart))
    graph.add((EX.item, CD.communicativeRole, CD.ChartRole))
    graph.add((EX.item, CD.selectionPath, Literal("cd:body")))
    graph.add((EX.item, CD.language, Literal("en")))
    return CoursePathReference(str(EX.path), str(EX.named_graph))


class GroupedAnovaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Retain every shape node, including referenced group/observation shapes.
        # Only the small fixture is validated, never the canonical dataset.
        cls.shapes = Graph()
        for filename in ("scientific-experiments.trig", "dot-plot-shapes.trig"):
            source = Dataset(default_union=True)
            source.parse(ROOT / "ontology" / "dataset" / filename, format="trig")
            for subject, predicate, value, _ in source.quads((None, None, None, None)):
                cls.shapes.add((subject, predicate, value))

    def setUp(self):
        self.dataset, self.graph = fixture()

    def assert_conforms(self, expected):
        conforms, _, report = validate(
            data_graph=self.dataset, shacl_graph=self.shapes,
            inference="none", meta_shacl=False, advanced=True,
        )
        self.assertEqual(bool(conforms), expected, report)

    def assert_rejected(self):
        with self.assertRaises(ValueError):
            chart_payload(self.dataset, EX.chart, "en")
        self.assert_conforms(False)

    def test_projection_preserves_identity_numbers_units_labels_and_sources(self):
        payload, path = chart_payload(self.dataset, EX.chart, "en")
        self.assertEqual(payload["chartType"], "experiment")
        self.assertEqual(payload["experimentKind"], "anova-one-way")
        self.assertEqual(payload["yAxis"]["unit"], "mg/L")
        self.assertEqual(payload["differenceUnit"], "mg/L difference")
        self.assertEqual(path, "skos:prefLabel@en")
        self.assertEqual([g["id"] for g in payload["groups"]], [compact(EX["arm-1"]), compact(EX["arm-2"])])
        self.assertEqual([g["label"] for g in payload["groups"]], ["Authored arm 1", "Authored arm 2"])
        self.assertEqual([[d["value"] for d in g["data"]] for g in payload["groups"]], [[1, 3], [5, 7]])
        self.assertEqual(payload["groups"][0]["data"][0]["id"], compact(EX["reading-1-1"]))
        self.assertEqual({p["key"] for p in payload["parameters"]}, {"betweenScale", "withinScale", "view"})
        self.assertNotIn("data", payload)
        for group in payload["groups"]:
            self.assertEqual(set(group), {"id", "label", "source", "data"})
            self.assertTrue(group["source"])
            for datum in group["data"]:
                self.assertTrue(datum["source"])
                self.assertNotIn("y", datum)
        for parameter in payload["parameters"]:
            self.assertTrue(parameter["source"])
        self.assertIn(str(EX.named_graph), json.dumps(payload))
        self.assert_conforms(True)

    def test_observations_can_also_belong_to_a_master_dataset(self):
        self.graph.add((EX.master, RDF.type, CD.Dataset))
        self.graph.add((EX.master, CD.hasObservation, EX["reading-1-1"]))
        chart_payload(self.dataset, EX.chart, "en")
        self.assert_conforms(True)

    def test_unknown_kind(self):
        self.graph.set((EX.chart, CD.experimentKind, Literal("not-a-mechanism")))
        self.assert_rejected()

    def test_wrong_chart_type(self):
        self.graph.set((EX.chart, CD.chartType, CD.DotPlot))
        self.assert_rejected()

    def test_group_must_be_typed(self):
        self.graph.remove((EX["arm-1"], RDF.type, CD.ChartGroup))
        self.assert_rejected()

    def test_observation_must_be_typed(self):
        self.graph.remove((EX["reading-1-1"], RDF.type, CD.Observation))
        self.assert_rejected()

    def test_missing_units(self):
        for predicate in (CD.yAxisUnit, CD.differenceUnit):
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                self.graph.remove((EX.chart, predicate, None))
                self.assert_rejected()

    def test_blank_difference_unit(self):
        self.graph.set((EX.chart, CD.differenceUnit, Literal("   ")))
        self.assert_rejected()

    def test_dataset_unit_must_match_response_unit(self):
        self.graph.set((EX["measurements-1"], CD.unit, Literal("g/L")))
        self.assert_rejected()

    def test_duplicate_membership_with_otherwise_valid_positions(self):
        self.graph.remove((EX["measurements-2"], CD.hasObservation, None))
        for index in (1, 2):
            self.graph.add((EX["measurements-2"], CD.hasObservation, EX[f"reading-1-{index}"]))
        self.assert_rejected()

    def test_group_positions_must_be_contiguous(self):
        self.graph.set((EX["arm-2"], CD.position, Literal(3)))
        self.assert_rejected()

    def test_observation_positions_must_be_contiguous(self):
        self.graph.set((EX["reading-1-2"], CD.position, Literal(3)))
        self.assert_rejected()

    def test_at_least_two_groups(self):
        self.graph.remove((EX.chart, CD.hasChartGroup, EX["arm-2"]))
        self.assert_rejected()

    def test_at_least_two_observations_per_group(self):
        self.graph.remove((EX["measurements-1"], CD.hasObservation, EX["reading-1-2"]))
        self.assert_rejected()

    def test_at_most_twenty_groups(self):
        self.dataset, self.graph = fixture(group_count=21)
        self.assert_rejected()

    def test_total_observation_limit(self):
        self.dataset, self.graph = fixture(observations_per_group=501)
        with self.assertRaisesRegex(ValueError, "1000"):
            chart_payload(self.dataset, EX.chart, "en")
        # Isolate the aggregate constraint while retaining all referenced nodes.
        # Avoid repeatedly running the position queries over this larger fixture.
        sh = Namespace("http://www.w3.org/ns/shacl#")
        shapes = Graph()
        for triple in self.shapes:
            shapes.add(triple)
        for subject, predicate, value in list(shapes.triples((None, None, None))):
            if predicate in (sh.targetClass, sh.targetSubjectsOf, sh.targetObjectsOf, sh.targetNode):
                shapes.remove((subject, predicate, value))
        shapes.add((CD.GroupedAnovaShape, sh.targetNode, EX.chart))
        conforms, _, report = validate(
            data_graph=self.dataset, shacl_graph=shapes,
            inference="none", meta_shacl=False, advanced=True,
        )
        self.assertFalse(conforms, report)
        self.assertIn("1000", report)

    def test_chart_extras_are_rejected_even_when_false(self):
        extras = (
            CD.numericXAxis, CD.drawStems, CD.yAxisMinimum, CD.markerRadius,
            CD.markerOpacity, CD.summaryRadius, CD.observationLabel,
            CD.summaryLabel, CD.chartPresentation, CD.lineInterpolation,
            CD.showChartPoints, CD.chartYMinimum, CD.chartYMaximum,
            CD.fenceMultiplier, CD.showObservations, CD.hasChartAnnotation,
            DCT.hasPart,
        )
        for predicate in extras:
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                self.graph.add((EX.chart, predicate, Literal(False)))
                self.assert_rejected()

    def test_group_decorations_are_rejected(self):
        for predicate in (CD.groupXValue, CD.summaryResult, CD.displayInterval):
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                self.graph.add((EX["arm-1"], predicate, decimal(1)))
                self.assert_rejected()

    def test_flat_dataset_cannot_be_mixed_with_groups(self):
        self.graph.add((EX.chart, CD.usesDataset, EX["measurements-1"]))
        self.assert_rejected()

    def test_negative_bounds(self):
        self.graph.set((EX["control-1"], CD.parameterMinimum, decimal(-1)))
        self.assert_rejected()

    def test_invalid_parameter_value_and_step(self):
        for predicate, value in ((CD.numericValue, 3), (CD.parameterStep, 0)):
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                self.graph.set((EX["control-1"], predicate, decimal(value)))
                self.assert_rejected()

    def test_parameter_keys_are_exact_and_unique(self):
        for key in ("unsupported", "withinScale"):
            with self.subTest(key=key):
                self.dataset, self.graph = fixture()
                self.graph.set((EX["control-1"], CD.parameterKey, Literal(key)))
                self.assert_rejected()

    def test_old_dot_plot_remains_valid(self):
        self.graph.set((EX.chart, CD.chartType, CD.DotPlot))
        self.graph.remove((EX.chart, CD.experimentKind, None))
        self.graph.remove((EX.chart, CD.differenceUnit, None))
        payload, _ = chart_payload(self.dataset, EX.chart, "en")
        self.assertEqual(payload["chartType"], "dot")
        self.assert_conforms(True)

    def test_old_experiment_remains_ungrouped(self):
        self.graph.set((EX.chart, CD.experimentKind, Literal("normal")))
        self.graph.remove((EX.chart, CD.hasChartGroup, None))
        self.graph.remove((EX.chart, CD.differenceUnit, None))
        payload, _ = chart_payload(self.dataset, EX.chart, "en")
        self.assertEqual(payload["experimentKind"], "normal")
        self.assertNotIn("groups", payload)
        self.assertNotIn("differenceUnit", payload)
        self.assert_conforms(True)

    def test_old_experiments_do_not_accept_grouped_fields(self):
        for predicate, value in ((CD.hasChartGroup, EX["arm-1"]), (CD.differenceUnit, Literal("mg/L"))):
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                self.graph.set((EX.chart, CD.experimentKind, Literal("normal")))
                self.graph.remove((EX.chart, CD.hasChartGroup, None))
                self.graph.remove((EX.chart, CD.differenceUnit, None))
                self.graph.add((EX.chart, predicate, value))
                self.assert_rejected()

    def test_exact_parameter_domain_upper_endpoints(self):
        for index in (1, 2):
            self.graph.set((EX[f"control-{index}"], CD.parameterMaximum, decimal(3)))
            self.graph.set((EX[f"control-{index}"], CD.numericValue, decimal(3)))
        self.graph.set((EX["control-3"], CD.numericValue, decimal(2)))
        payload, _ = chart_payload(self.dataset, EX.chart, "en")
        controls = {parameter["key"]: parameter for parameter in payload["parameters"]}
        for key in ("betweenScale", "withinScale"):
            self.assertEqual(controls[key]["maximum"], 3)
            self.assertEqual(controls[key]["value"], 3)
        self.assertEqual(controls["view"]["maximum"], 2)
        self.assertEqual(controls["view"]["value"], 2)
        self.assert_conforms(True)

    def test_scale_maximum_above_three_rejected_with_valid_value(self):
        for index in (1, 2):
            with self.subTest(control=index):
                self.dataset, self.graph = fixture()
                resource = EX[f"control-{index}"]
                self.graph.set((resource, CD.parameterMaximum, decimal("3.1")))
                self.assertEqual(list(self.graph.objects(resource, CD.numericValue)), [decimal(1)])
                self.assert_rejected()

    def test_view_maximum_above_two_rejected_with_valid_value(self):
        self.graph.set((EX["control-3"], CD.numericValue, decimal(1)))
        self.graph.set((EX["control-3"], CD.parameterMaximum, decimal(3)))
        self.assert_rejected()

    def test_fractional_view_fields_rejected(self):
        cases = (
            (CD.numericValue, "0.5"),
            (CD.parameterMinimum, "0.5"),
            (CD.parameterMaximum, "1.5"),
            (CD.parameterStep, "0.5"),
        )
        for predicate, value in cases:
            with self.subTest(predicate=predicate):
                self.dataset, self.graph = fixture()
                # Keep every case inside its authored bounds, so integrality
                # rather than an unrelated bounds error causes rejection.
                self.graph.set((EX["control-3"], CD.numericValue, decimal(1)))
                self.graph.set((EX["control-3"], predicate, decimal(value)))
                self.assert_rejected()

    def test_scale_fractional_bounds_values_and_steps_remain_valid(self):
        for index in (1, 2):
            resource = EX[f"control-{index}"]
            self.graph.set((resource, CD.parameterMinimum, decimal("0.25")))
            self.graph.set((resource, CD.numericValue, decimal("1.25")))
            self.graph.set((resource, CD.parameterMaximum, decimal("2.75")))
            self.graph.set((resource, CD.parameterStep, decimal("0.25")))
        chart_payload(self.dataset, EX.chart, "en")
        self.assert_conforms(True)

    def test_real_grouped_scene_compiles_as_version_1_15(self):
        selected_path = scene_path_fixture(self.graph)
        payload, label_path = chart_payload(self.dataset, EX.chart, "en")
        document = compile_scene_document(self.dataset, selected_path)
        self.assertEqual(document["version"], "1.15")
        self.assertEqual(document["sourcePathId"], compact(EX.path))
        self.assertEqual(len(document["scenes"]), 1)
        scene = document["scenes"][0]
        self.assertEqual(scene["id"], f"{compact(EX.scene)}--scene")
        self.assertEqual(len(scene["blocks"]), 1)
        block = scene["blocks"][0]
        self.assertEqual(block["id"], f"{compact(EX.item)}--block")
        self.assertEqual(block["kind"], "chart")
        self.assertEqual(scene["readingOrder"], [block["id"]])
        for key, value in payload.items():
            self.assertEqual(block[key], value, key)
        self.assertEqual(block["differenceUnit"], "mg/L difference")
        self.assertEqual(block["groups"], payload["groups"])
        self.assertEqual(
            [reference["relationPath"] for reference in block["source"]],
            ["cd:body", "cd:chartType", "cd:experimentKind", "cd:hasChartGroup",
             "cd:yAxisUnit", "cd:differenceUnit", "cd:hasExperimentParameter", label_path],
        )
        self.assertEqual(label_path, "skos:prefLabel@en")
        for reference in block["source"]:
            self.assertEqual(reference["resourceId"], compact(EX.chart))
            self.assertIn(str(EX.named_graph), json.dumps(reference))
        self.assertIn(str(EX.named_graph), json.dumps(block["groups"]))

    def test_real_old_normal_scene_compiles_as_version_1_14(self):
        self.graph.set((EX.chart, CD.experimentKind, Literal("normal")))
        self.graph.remove((EX.chart, CD.hasChartGroup, None))
        self.graph.remove((EX.chart, CD.differenceUnit, None))
        selected_path = scene_path_fixture(self.graph)
        payload, _ = chart_payload(self.dataset, EX.chart, "en")
        document = compile_scene_document(self.dataset, selected_path)
        self.assertEqual(document["version"], "1.14")
        self.assertEqual(len(document["scenes"]), 1)
        self.assertEqual(len(document["scenes"][0]["blocks"]), 1)
        block = document["scenes"][0]["blocks"][0]
        self.assertEqual(block["kind"], "chart")
        self.assertEqual(block["experimentKind"], "normal")
        self.assertNotIn("groups", block)
        self.assertNotIn("differenceUnit", block)
        for key, value in payload.items():
            self.assertEqual(block[key], value, key)
        self.assert_conforms(True)

    def test_version_registry_promotes_without_downgrading(self):
        self.assertEqual(promote_document_version("1.14", "1.15"), "1.15")
        self.assertEqual(promote_document_version("1.14", "1.14"), "1.14")
        self.assertEqual(promote_document_version("1.15", "1.14"), "1.15")


if __name__ == "__main__":
    unittest.main()
