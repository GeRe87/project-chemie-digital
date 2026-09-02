from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from pyshacl.errors import ReportableRuntimeError
from rdflib import Graph, Literal, Namespace, OWL, RDF, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert SPEC and SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location(
    "validate_semantics", ROOT / "scripts" / "validate_semantics.py"
)
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SH = Namespace("http://www.w3.org/ns/shacl#")
SHAPES_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/core")


class StandardDeviationKnowledgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)

    def test_core_concepts_have_unique_german_and_english_labels(self) -> None:
        concepts = {
            EX["standard-deviation"], EX["sample-standard-deviation"],
            EX["population-standard-deviation"], EX["variance"],
            EX["standard-error"], EX["relative-standard-deviation"],
            EX["measurement-precision"], EX["trueness"], EX["measurement-uncertainty"],
        }
        for concept in concepts:
            labels = list(self.graph.objects(concept, SKOS.prefLabel))
            self.assertEqual(1, sum(label.language == "de" for label in labels), concept)
            self.assertEqual(1, sum(label.language == "en" for label in labels), concept)

    def test_basic_and_university_definitions_are_scoped_and_sourced(self) -> None:
        definitions = list(self.graph.objects(EX["standard-deviation"], CD.hasDefinition))
        self.assertEqual(4, len(definitions))
        scopes = [str(next(self.graph.objects(definition, CD.definitionScope))) for definition in definitions]
        self.assertEqual(2, scopes.count("basic"))
        self.assertEqual(2, scopes.count("university"))
        for definition in definitions:
            self.assertTrue(any(self.graph.objects(definition, CD.hasSource)))
            self.assertTrue(any(self.graph.objects(definition, CD.body)))

    def test_formula_families_are_distinct_and_symbol_complete(self) -> None:
        sample = EX["sample-sd-formula"]
        population = EX["population-sd-formula"]
        self.assertEqual({Literal("sample")}, set(self.graph.objects(sample, CD.formulaFamily)))
        self.assertEqual({Literal("population")}, set(self.graph.objects(population, CD.formulaFamily)))
        self.assertEqual(
            {EX["s-symbol"], EX["n-symbol"], EX["xi-symbol"], EX["xbar-symbol"]},
            set(self.graph.objects(sample, CD.hasSymbol)),
        )
        self.assertEqual(
            {EX["sigma-symbol"], EX["N-symbol"], EX["xi-symbol"], EX["mu-symbol"]},
            set(self.graph.objects(population, CD.hasSymbol)),
        )

    def test_prerequisite_graph_is_acyclic(self) -> None:
        query = """
            PREFIX cd: <https://w3id.org/project-chemie-digital/ontology/>
            SELECT ?concept WHERE { ?concept cd:prerequisite+ ?concept }
        """
        self.assertEqual([], list(self.graph.query(query)))

    def test_no_forbidden_scientific_equivalence_is_authored(self) -> None:
        forbidden = {
            EX["variance"], EX["standard-error"], EX["accuracy"],
            EX["measurement-uncertainty"],
        }
        self.assertTrue(forbidden.isdisjoint(set(self.graph.objects(EX["standard-deviation"], OWL.sameAs))))

    def test_repeated_measurement_dataset_and_steps_are_ordered(self) -> None:
        observations = list(self.graph.objects(EX["dataset-ph"], CD.hasObservation))
        values = sorted(
            (int(next(self.graph.objects(item, CD.position))),
             str(next(self.graph.objects(item, CD.numericValue))))
            for item in observations
        )
        self.assertEqual([(1, "6.98"), (2, "7.01"), (3, "7.00"), (4, "7.02"), (5, "6.99")], values)
        steps = list(self.graph.objects(EX["worked-example-repeated-ph"], CD.hasCalculationStep))
        self.assertEqual([1, 2, 3, 4], sorted(int(next(self.graph.objects(step, CD.position))) for step in steps))

    def test_nine_scenes_and_path_steps_resolve_to_authored_resources(self) -> None:
        scenes = set(self.graph.subjects(RDF.type, CD.SceneDefinition))
        canonical_scenes = {scene for scene in scenes if str(scene).startswith(str(EX["scene-"]))}
        self.assertGreaterEqual(len(canonical_scenes), 9)
        path_steps = list(self.graph.objects(EX["path-standard-deviation"], CD.hasStep))
        self.assertEqual(list(range(1, 10)), sorted(int(next(self.graph.objects(step, CD.position))) for step in path_steps))
        for item in self.graph.subjects(RDF.type, CD.SceneItem):
            selected = next(self.graph.objects(item, CD.selectsResource))
            self.assertIn(Literal(True), set(self.graph.objects(selected, CD.authoredResource)))

    def test_standard_deviation_path_scenes_obey_the_accepted_scene_item_contract(self) -> None:
        allowed_roles = {CD.HeadingRole, CD.QuotationRole, CD.CitationRole, CD.CodeRole, CD.PollRole}
        allowed_paths = {
            Literal("skos:prefLabel@de"),
            Literal("cd:hasDefinition"),
            Literal("cd:hasDefinition/cd:hasSource"),
            Literal("cd:hasCodeExample"),
            Literal("cd:hasAudiencePoll"),
        }
        path_steps = set(self.graph.objects(EX["path-standard-deviation"], CD.hasStep))
        scenes = set()
        for step in path_steps:
            step_scenes = set(self.graph.objects(step, CD.usesScene))
            self.assertEqual(1, len(step_scenes), step)
            scenes.update(step_scenes)
        self.assertEqual(9, len(scenes))
        for scene in scenes:
            positions = []
            for item in self.graph.objects(scene, CD.hasSceneItem):
                positions.append(int(next(self.graph.objects(item, CD.position))))
                self.assertIn(next(self.graph.objects(item, CD.communicativeRole)), allowed_roles)
                self.assertIn(next(self.graph.objects(item, CD.selectionPath)), allowed_paths)
            self.assertEqual(list(range(1, len(positions) + 1)), sorted(positions), scene)

    def test_r_code_example_is_authored_and_attached_to_the_exercise_scene(self) -> None:
        code = EX["sd-r-code-example"]
        self.assertIn(CD.CodeExample, set(self.graph.objects(code, RDF.type)))
        self.assertEqual({Literal("r")}, set(self.graph.objects(code, CD.programmingLanguage)))
        self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.editable)))
        self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.executable)))
        self.assertEqual("x <- c(6, 8, 10)\nsd(x)", str(next(self.graph.objects(code, CD.code))))
        self.assertIn(code, set(self.graph.objects(EX["exercise-calculate-s"], CD.hasCodeExample)))
        self.assertIn(EX["scene9-code"], set(self.graph.objects(EX["scene-exercise-recap"], CD.hasSceneItem)))
        self.assertEqual({Literal(5)}, set(self.graph.objects(EX["scene9-code"], CD.position)))

    def test_audience_poll_is_authored_with_graph_backed_options(self) -> None:
        poll = EX["sd-precision-poll"]
        options = {EX["sd-precision-option-a"], EX["sd-precision-option-b"]}
        self.assertIn(CD.AudiencePoll, set(self.graph.objects(poll, RDF.type)))
        self.assertEqual(options, set(self.graph.objects(poll, CD.hasPollOption)))
        self.assertIn(poll, set(self.graph.objects(EX["standard-deviation"], CD.hasAudiencePoll)))
        self.assertIn(EX["scene9-poll"], set(self.graph.objects(EX["scene-exercise-recap"], CD.hasSceneItem)))
        self.assertEqual({Literal(4)}, set(self.graph.objects(EX["scene9-poll"], CD.position)))
        self.assertEqual({CD.PollRole}, set(self.graph.objects(EX["scene9-poll"], CD.communicativeRole)))
        for option in options:
            self.assertIn(CD.PollOption, set(self.graph.objects(option, RDF.type)))
            self.assertTrue(any(self.graph.objects(option, SKOS.prefLabel)))

    def test_standard_deviation_sources_are_owned_by_learning_resources(self) -> None:
        self.assertEqual([], list(self.graph.objects(EX["standard-deviation"], CD.hasSource)))
        for definition in self.graph.objects(EX["standard-deviation"], CD.hasDefinition):
            self.assertTrue(any(self.graph.objects(definition, CD.hasSource)), definition)

    def test_definition_and_example_resources_are_reused(self) -> None:
        selected = list(self.graph.subjects(CD.selectsResource, EX["standard-deviation"]))
        referenced = list(self.graph.subjects(CD.focusConcept, EX["standard-deviation"]))
        self.assertGreaterEqual(len(selected) + len(referenced), 3)
        self.assertGreaterEqual(len(list(self.graph.subjects(CD.selectsResource, EX["worked-example-repeated-ph"]))), 1)

    def test_sources_are_project_graph_resources_without_example_org_placeholders(self) -> None:
        sources = set(self.graph.subjects(RDF.type, CD.Source))
        self.assertGreaterEqual(len(sources), 4)
        for source in sources:
            self.assertNotIn("example.org", str(source))
            self.assertTrue(any(self.graph.objects(source, CD.supportsResource)))

    def test_named_shapes_graph_is_meta_shacl_conformant(self) -> None:
        shapes = self.dataset.graph(SHAPES_GRAPH)
        try:
            validate(
                data_graph=Graph(),
                shacl_graph=shapes,
                inference="none",
                abort_on_first=False,
                allow_infos=False,
                allow_warnings=False,
                meta_shacl=True,
            )
        except ReportableRuntimeError as error:
            self.fail(f"Named shapes graph is not SHACL meta-conformant: {error}")

    def test_embedded_shacl_sparql_avoids_prohibited_clauses(self) -> None:
        prohibited = ("VALUES", "MINUS", "SERVICE")
        for query in self.dataset.graph(SHAPES_GRAPH).objects(None, SH.select):
            normalized = str(query).upper()
            for clause in prohibited:
                self.assertNotIn(clause, normalized, f"{clause} found in SHACL-SPARQL query: {query}")

    def test_shacl_rejects_forbidden_equivalence_mutation(self) -> None:
        mutated = Graph()
        for triple in self.graph:
            mutated.add(triple)
        mutated.add((EX["standard-deviation"], OWL.sameAs, EX["standard-error"]))
        conforms, _, report = validate(
            data_graph=mutated,
            shacl_graph=self.dataset.graph(SHAPES_GRAPH),
            inference="rdfs",
            abort_on_first=False,
            allow_infos=False,
            allow_warnings=False,
            meta_shacl=True,
        )
        self.assertFalse(bool(conforms), str(report))

    def test_fingerprint_is_stable_for_reversed_source_order(self) -> None:
        forward = RDF_DATASET.assemble_dataset(include_legacy=False)
        reverse = RDF_DATASET.assemble_dataset(
            include_legacy=False,
            trig_paths=tuple(reversed(RDF_DATASET.CANONICAL_TRIG)),
        )
        self.assertEqual(RDF_DATASET.dataset_fingerprint(forward), RDF_DATASET.dataset_fingerprint(reverse))


if __name__ == "__main__":
    unittest.main()
