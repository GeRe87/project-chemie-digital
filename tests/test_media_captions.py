from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Dataset, Literal, Namespace, URIRef

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from media_scene_projection import enrich_scene_documents_with_media

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
DCT = Namespace("http://purl.org/dc/terms/")


class MediaCaptionTests(unittest.TestCase):
    def test_nitrate_figure_finding_keeps_one_owner_after_caption_separation(self):
        import rdf_dataset
        dataset = rdf_dataset.assemble_dataset(include_legacy=False)
        finding = EX['chemometrics-nitrate-discussion-c-highest']
        owners = {subject for subject, _, _, _ in dataset.quads((None, CD.hasKeyPoint, finding, None))}
        self.assertEqual(owners, {EX['chart-chemometrics-nitrate-means']})
        discussion = EX['chemometrics-nitrate-case-discussion']
        self.assertEqual({point for _, _, point, _ in dataset.quads((discussion, CD.hasKeyPoint, None, None))},
                         {EX['chemometrics-nitrate-discussion-variation']})

    def test_authored_exercise_media_gets_the_same_caption_as_direct_media(self):
        import generate_canonical_runtime as runtime
        import rdf_dataset

        dataset = rdf_dataset.assemble_dataset(include_legacy=False)
        expected = runtime.media_asset_payload(dataset, EX["mean-journey-sketch"], "en")["caption"]
        artifact = runtime.build_artifact(runtime.CourseUnitPathSelectionRequest(
            offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
            placement_id=str(EX["unit-placement-chemometrics-mean-values"]),
            unit_id=str(EX["learning-unit-mean-values"]),
            requested_path_id=str(EX["path-chemometrics-mean-values-lecture"]),
            requested_path_graph_id="https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture",
        ))

        def walk(blocks):
            for block in blocks:
                yield block
                yield from walk(block.get("children", []))

        media = [block for document in artifact["sceneDocuments"] for scene in document["scenes"]
                 for block in walk(scene["blocks"]) if block["kind"] == "media-reference"]
        self.assertEqual(len(media), 12)
        self.assertTrue(all(block.get("caption") for block in media))
        journey = [block for block in media if block["uri"].endswith("mean-values-journey.svg")]
        self.assertEqual(len(journey), 2)
        for block in journey:
            self.assertEqual(block["caption"], expected)
            self.assertTrue(any(source.get("relationPath") == "dct:description" for source in block["source"]))

    def test_linked_media_preserves_authored_caption_and_named_graph_provenance(self):
        dataset = Dataset()
        graph_id = URIRef("urn:test:media-graph")
        graph = dataset.graph(graph_id)
        graph.add((EX.exercise, CD.hasMedia, EX.sketch))
        graph.add((EX.sketch, CD.uri, Literal("/sketch.svg")))
        graph.add((EX.sketch, CD.mediaType, Literal("image/svg+xml")))
        graph.add((EX.sketch, CD.alternativeText, Literal("Accessible alternative", lang="en")))
        graph.add((EX.sketch, DCT.description, Literal("Authored figure finding", lang="en")))
        original = [{"scenes": [{"blocks": [{"id": "exercise", "kind": "prose", "text": "Keep the task", "source": [{"resourceId": "ex:exercise"}]}]}]}]
        enriched = enrich_scene_documents_with_media(original, dataset)
        children = enriched[0]["scenes"][0]["blocks"][0]["children"]
        self.assertEqual(children[0]["text"], "Keep the task")
        self.assertEqual(children[1]["caption"], "Authored figure finding")
        self.assertEqual(children[1]["alternativeText"], "Accessible alternative")
        self.assertIn({"resourceId": "ex:sketch", "provenanceIds": [str(graph_id)], "relationPath": "dct:description"}, children[1]["source"])
        self.assertEqual(original[0]["scenes"][0]["blocks"][0]["kind"], "prose")
        graph.remove((EX.sketch, DCT.description, None))
        without_caption = enrich_scene_documents_with_media(original, dataset)
        self.assertNotIn("caption", without_caption[0]["scenes"][0]["blocks"][0]["children"][1])


if __name__ == "__main__":
    unittest.main()
