"""First reviewed increment only: B01/B02, isolated from the accepted offering."""
import sys
import unittest
from pathlib import Path
from rdflib import Namespace, Literal, XSD
from pyshacl import validate

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import rdf_dataset
import generate_canonical_runtime as runtime
import validate_semantics

BASE = "https://w3id.org/project-chemie-digital/graph/"
CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")

class BinomialOpeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX["path-level5-binomial-opening"]), BASE + "paths/level5-binomial-opening"))

    def test_compiles_exactly_the_first_two_scenes_in_english_with_no_early_formula(self):
        self.assertEqual("1.13", self.document["version"])
        self.assertEqual(["ex:l5-b01-scene--scene", "ex:l5-b02-scene--scene"], [s["id"] for s in self.document["scenes"][:2]])
        for scene in self.document["scenes"][:2]:
            self.assertTrue(scene["narration"])
            self.assertEqual(["prose", "diagram"], [b["kind"] for b in scene["blocks"]])
            self.assertTrue(scene["blocks"][1]["binaryExperiment"]["source"])
            self.assertNotIn("PDF", scene["blocks"][0]["text"])
            self.assertIn("population", scene["narration"])
        graph = self.dataset.graph(BASE + "scenes/level5-binomial-opening")
        self.assertEqual({"en"}, {str(lang) for lang in graph.objects(None, CD.language)})
        for name in ("knowledge/binary-outcomes", "specifications/level5-binomial-opening", "scenes/level5-binomial-opening", "paths/level5-binomial-opening"):
            for _, _, value in self.dataset.graph(BASE + name):
                if isinstance(value, Literal) and value.language:
                    self.assertEqual("en", value.language)

    def test_authored_experiment_projects_exact_model_and_seed(self):
        first, second = [s["blocks"][1]["binaryExperiment"] for s in self.document["scenes"][:2]]
        self.assertEqual(("decision", 1), (first["mode"], first["trialCount"]))
        self.assertEqual(("series", 10, .2, 20261030), (second["mode"], second["trialCount"], second["positiveProbability"], second["seed"]))
        self.assertEqual(("positive", "negative", "Sample"), (second["positiveLabel"], second["negativeLabel"], second["unitLabel"]))

    def test_intro_connects_screening_to_population_without_equating_result_and_truth(self):
        scene = self.document["scenes"][0]
        description = scene["blocks"][1]["description"]
        self.assertIn("positive-finding frequency", description)
        self.assertIn("defined water population", description)
        self.assertIn("not a concentration or an infallible true state", description)
        self.assertIn("not a legal safety limit", scene["narration"])

    def test_accepted_course_placement_is_unchanged(self):
        union = validate_semantics.dataset_union(self.dataset)
        placements = set(union.objects(EX["teaching-offering-chemometrics-applied-statistics"], CD.hasUnitPlacement))
        self.assertEqual(5, len(placements))
        self.assertNotIn(EX["placement-level5-binomial-preview"], placements)

    def test_shacl_accepts_authored_models_and_rejects_invalid_probability(self):
        union = validate_semantics.dataset_union(self.dataset)
        shape = self.dataset.graph(BASE + "shapes/binary-experiment")
        self.assertTrue(validate(union, shacl_graph=shape, advanced=True)[0])
        union.set((EX["l5-b02-model"], CD.binaryPositiveProbability, Literal("1.1", datatype=XSD.decimal)))
        self.assertFalse(validate(union, shacl_graph=shape, advanced=True)[0])

    def test_shacl_rejects_invalid_seed_and_decision_trial_count(self):
        for subject, predicate, value in [("l5-b02-model", CD.binarySeed, -1), ("l5-b01-model", CD.binaryTrialCount, 10)]:
            union = validate_semantics.dataset_union(self.dataset)
            union.set((EX[subject], predicate, Literal(value, datatype=XSD.integer)))
            self.assertFalse(validate(union, shacl_graph=self.dataset.graph(BASE + "shapes/binary-experiment"), advanced=True)[0])

    def test_compiler_rejects_invalid_configuration_without_relying_on_shacl(self):
        dataset = rdf_dataset.assemble_dataset()
        graph = dataset.graph(BASE + "specifications/level5-binomial-opening")
        graph.set((EX["l5-b02-model"], CD.binaryPositiveProbability, Literal("1.1", datatype=XSD.decimal)))
        with self.assertRaisesRegex(ValueError, "Invalid binary"):
            runtime.flow_diagram_payload(dataset, EX["l5-b02-flow"], "en")

if __name__ == "__main__":
    unittest.main()
