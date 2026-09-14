from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Namespace, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as BASE  # noqa: E402
import generate_canonical_runtime_media as MEDIA_RUNTIME  # noqa: E402
import rdf_dataset as RDF_DATASET  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SKOS = Namespace("http://www.w3.org/2004/02/skos/core#")
OFFERING = EX["teaching-offering-cogniflow-standardized-data-processing"]
PLACEMENT = EX["unit-placement-cogniflow-standardized-data-processing"]
UNIT = EX["learning-unit-cogniflow-standardized-data-processing"]
PATH = EX["path-cogniflow-standardized-data-processing"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/cogniflow-standardized-data-processing")


def request() -> BASE.CourseUnitPathSelectionRequest:
    return BASE.CourseUnitPathSelectionRequest(
        offering_id=str(OFFERING),
        placement_id=str(PLACEMENT),
        unit_id=str(UNIT),
        requested_path_id=str(PATH),
        requested_path_graph_id=str(PATH_GRAPH),
    )


def source_ids(block: dict) -> set[str]:
    return {source["resourceId"] for source in block.get("source", [])}


def relation_paths(block: dict) -> set[str]:
    return {
        source["relationPath"]
        for source in block.get("source", [])
        if source.get("relationPath")
    }


def dataset_objects(dataset, subject, predicate) -> set[object]:
    return {
        obj
        for _subject, _predicate, obj, _graph in dataset.quads((subject, predicate, None, None))
    }


class CogniFlowTitleMediaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)

    def test_title_semantics_link_authors_to_institutions_and_concept_to_funder(self) -> None:
        self.assertIn(
            EX["organization-ude"],
            dataset_objects(self.dataset, EX["attribution-cogniflow-gerrit-renner"], CD.affiliatedWith),
        )
        self.assertIn(
            EX["organization-iuta"],
            dataset_objects(self.dataset, EX["attribution-cogniflow-ricardo-cunha"], CD.affiliatedWith),
        )
        self.assertIn(
            EX["organization-munv"],
            dataset_objects(self.dataset, EX["cogniflow-standardized-data-processing"], CD.fundedBy),
        )
        self.assertIn(
            EX["organization-munv"],
            dataset_objects(self.dataset, EX["attribution-cogniflow-funding"], CD.fundingSource),
        )

    def test_iuta_uses_formal_organization_name_with_short_label(self) -> None:
        labels = {
            str(value)
            for value in dataset_objects(self.dataset, EX["organization-iuta"], SKOS.prefLabel)
        }
        short_labels = {
            str(value)
            for value in dataset_objects(self.dataset, EX["organization-iuta"], SKOS.altLabel)
        }
        self.assertIn("Institut für Umwelt & Energie, Technik & Analytik e. V. (IUTA)", labels)
        self.assertIn("IUTA", short_labels)

    def test_media_aware_title_projects_authors_and_funding_to_renderer_neutral_groups(self) -> None:
        artifact = MEDIA_RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        title = document["scenes"][0]

        self.assertEqual("ex:scene-cogniflow-title--scene", title["id"])
        self.assertEqual(["prose", "group", "group", "group"], [block["kind"] for block in title["blocks"]])

        expected = [
            (
                "Gerrit Renner — Instrumental Analytical Chemistry, University of Duisburg-Essen",
                "ex:media-ude-logo",
                "cd:affiliatedWith",
                "image/svg+xml",
            ),
            (
                "Ricardo Cunha — Institut für Umwelt & Energie, Technik & Analytik e. V. (IUTA)",
                "ex:media-iuta-logo",
                "cd:affiliatedWith",
                "image/png",
            ),
            (
                "Funding",
                "ex:media-munv-logo",
                "cd:fundingSource",
                "image/jpeg",
            ),
        ]

        for group, (text, media_id, relationship, media_type) in zip(title["blocks"][1:], expected, strict=True):
            self.assertEqual("group", group["kind"])
            self.assertEqual(2, len(group["children"]))
            prose, media = group["children"]
            self.assertEqual("prose", prose["kind"])
            self.assertEqual(text, prose["text"])
            self.assertEqual("media-reference", media["kind"])
            self.assertEqual(media_type, media["mediaType"])
            self.assertTrue(media["uri"].startswith("https://"))
            self.assertTrue(media["alternativeText"])
            self.assertIn(media_id, source_ids(media))
            self.assertIn(relationship, relation_paths(media))
            self.assertEqual(group["readingOrder"], [child["id"] for child in group["children"]])

        self.assertEqual(title["readingOrder"], [block["id"] for block in title["blocks"]])

    def test_title_media_assets_are_not_invented_by_renderer(self) -> None:
        artifact = MEDIA_RUNTIME.build_artifact(request())
        title = artifact["sceneDocuments"][0]["scenes"][0]
        media = [
            child
            for group in title["blocks"]
            if group["kind"] == "group"
            for child in group["children"]
            if child["kind"] == "media-reference"
        ]
        self.assertEqual(
            {
                "ex:media-ude-logo",
                "ex:media-iuta-logo",
                "ex:media-munv-logo",
            },
            {
                next(source_id for source_id in source_ids(block) if source_id.startswith("ex:media-"))
                for block in media
            },
        )
        self.assertTrue(all("cd:uri" in relation_paths(block) for block in media))


if __name__ == "__main__":
    unittest.main()
