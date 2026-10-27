import sys
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from pyshacl import validate
from rdflib import Dataset, Graph, Literal, RDF, URIRef

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_canonical_runtime as R
import presentation_collection as P
from presentation_metadata import project_title, title_fallback
from static_course_artifact import public_files

EX, CD = R.EX, R.CD
S = "https://schema.org/"
G = URIRef("https://w3id.org/project-chemie-digital/graph/presentations/talks")


class PresentationCollectionTest(unittest.TestCase):
    def setUp(self):
        self.dataset = Dataset()
        for name in ["talks.trig", "talks-vocabulary.trig", "talks-shapes.trig"]:
            self.dataset.parse(R.ROOT / "ontology/dataset" / name, format="trig")
        self.work = URIRef(EX + "talk-microplastics-ted-gc-ms")

    def build(self):
        with patch.object(R, "assemble_dataset", return_value=self.dataset):
            return P.build_collection_artifact(EX + "talks")

    def test_exact_bindings_and_title_are_semantic(self):
        before = set(self.dataset.quads((None, None, None, None)))
        artifact = self.build()
        self.assertEqual(len(artifact["sceneDocuments"]), 1)
        self.assertEqual(len(artifact["presentationCollection"]["talks"]), 1)
        binding = artifact["sceneDocumentBindings"][0]
        self.assertEqual(binding["pathGraphId"], "https://w3id.org/project-chemie-digital/graph/paths/talk-microplastics-ted-gc-ms")
        scene = artifact["sceneDocuments"][0]["scenes"][0]
        title = scene["presentationTitle"]
        self.assertEqual(title["title"], artifact["presentationCollection"]["talks"][0]["title"])
        self.assertEqual(title["authors"][0]["affiliations"][0]["lines"], ["University of Duisburg-Essen", "Faculty of Chemistry", "Instrumental Analytical Chemistry"])
        self.assertIn(title["title"], R.static_fallback(artifact))
        self.assertIn("Gerrit Renner", title_fallback(title))
        self.assertEqual(before, set(self.dataset.quads((None, None, None, None))))

    def test_unrelated_resources_do_not_leak(self):
        self.dataset.graph(URIRef(EX + "unrelated-graph")).add((URIRef(EX + "private-work"), R.SKOS.prefLabel, Literal("unrelated confidential label")))
        serialized = R.canonical_json(self.build())
        self.assertNotIn("confidential", serialized)
        self.assertNotIn("cogniflow", serialized.lower())

    def test_ambiguous_path_graph_fails_closed(self):
        self.dataset.graph(URIRef(EX + "second-path-graph")).add((URIRef(EX + "path-talk-microplastics-ted-gc-ms"), RDF.type, URIRef(CD + "LearningPath")))
        with self.assertRaisesRegex(ValueError, "exact named graph"):
            self.build()

    def test_second_talk_reuses_the_same_compiler_with_independent_exact_bindings(self):
        replacements = {URIRef(EX + old): URIRef(EX + new) for old, new in [
            ("talk-microplastics-ted-gc-ms", "future-talk"),
            ("path-talk-microplastics-ted-gc-ms", "a-future-path"),
            ("step-talk-microplastics-title", "future-step"),
            ("scene-talk-microplastics-title", "future-scene"),
            ("item-talk-microplastics-title", "future-item"),
            ("talk-microplastics-author-1", "future-author-role"),
        ]}
        for s, p, o, g in list(self.dataset.quads((None, None, None, None))):
            if "/graph/paths/" in str(g) or "/graph/scenes/" in str(g):
                target_graph = URIRef(str(g) + "-future")
            elif g == G:
                target_graph = g
            else:
                continue
            self.dataset.add((replacements.get(s, s), p, replacements.get(o, o), target_graph))
        artifact = self.build()
        self.assertEqual(len(artifact["sceneDocuments"]), 2)
        self.assertEqual(len({b["sceneDocumentId"] for b in artifact["sceneDocumentBindings"]}), 2)
        self.assertEqual([b["pathId"] for b in artifact["sceneDocumentBindings"]], sorted(b["pathId"] for b in artifact["sceneDocumentBindings"]))

    def test_optional_fields_and_multiple_authors(self):
        graph = self.dataset.graph(G)
        graph.remove((self.work, URIRef(S + "recordedAt"), None))
        graph.remove((self.work, URIRef(S + "logo"), None))
        role, person = URIRef(EX + "role-2"), URIRef(EX + "person-2")
        graph.add((self.work, URIRef(S + "author"), role))
        graph.add((role, URIRef(S + "position"), Literal(2)))
        graph.add((role, URIRef(S + "author"), person))
        graph.add((person, URIRef(S + "name"), Literal("Second author")))
        title = project_title(self.dataset, self.work)
        self.assertNotIn("event", title)
        self.assertEqual(title["logos"], [])
        self.assertEqual([a["name"] for a in title["authors"]], ["Gerrit Renner", "Second author"])
        self.assertEqual(title["authors"][1]["affiliations"], [])

    def test_affiliation_cycle_is_rejected(self):
        self.dataset.graph(G).add((URIRef(EX + "ude"), URIRef(S + "parentOrganization"), URIRef(EX + "ude-iac")))
        with self.assertRaisesRegex(ValueError, "Cyclic"):
            project_title(self.dataset, self.work)

    def check_shapes(self):
        data, shapes = Graph(), Graph()
        for s, p, o, g in self.dataset.quads((None, None, None, None)):
            (shapes if "/graph/shapes/" in str(g) else data).add((s, p, o))
        return validate(data, shacl_graph=shapes, inference="rdfs", meta_shacl=True)[0]

    def test_shapes_and_missing_title(self):
        self.assertTrue(self.check_shapes())
        self.dataset.graph(G).remove((self.work, R.SKOS.prefLabel, None))
        self.assertFalse(self.check_shapes())

    def test_shapes_reject_invalid_author_order_and_remote_logo(self):
        graph = self.dataset.graph(G)
        graph.set((URIRef(EX + "talk-microplastics-author-1"), URIRef(S + "position"), Literal(0)))
        self.assertFalse(self.check_shapes())
        graph.set((URIRef(EX + "talk-microplastics-author-1"), URIRef(S + "position"), Literal(1)))
        graph.add((URIRef(EX + "ude-logo-placeholder"), URIRef(S + "contentUrl"), Literal("https://unofficial.example/logo.svg")))
        self.assertFalse(self.check_shapes())

    def test_public_staging_excludes_unselected_presentations_and_host_configuration(self):
        with tempfile.TemporaryDirectory() as temporary:
            public = Path(temporary)
            for name in ["course-runtime/manifest.json", "course-runtime/static-course.html", "course-runtime/selected.json", "course-runtime/unrelated.json", "talks-assets/back_layer_dark.webp", "private-presentation/image.svg", "CNAME"]:
                path = public / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("fixture", encoding="utf-8")
            (public / "course-runtime/manifest.json").write_text('{"documents":[{"runtime":"course-runtime/selected.json"}]}', encoding="utf-8")
            artifact = self.build()
            for scene in artifact["sceneDocuments"][0]["scenes"]:
                for logo in scene.get("presentationTitle", {}).get("logos", []):
                    for key in ("uri", "darkUri"):
                        if logo.get(key):
                            asset = public / logo[key].lstrip("/")
                            asset.parent.mkdir(parents=True, exist_ok=True)
                            asset.write_text("selected logo fixture", encoding="utf-8")
            selected = {path.relative_to(public).as_posix() for path in public_files(public, artifact)}
            self.assertIn("course-runtime/selected.json", selected)
            self.assertNotIn("course-runtime/unrelated.json", selected)
            self.assertNotIn("private-presentation/image.svg", selected)
            self.assertNotIn("CNAME", selected)


if __name__ == "__main__":
    unittest.main()
