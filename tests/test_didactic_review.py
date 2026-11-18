"""Regression checks for revision and evidence binding of didactic reviews."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from rdflib import Dataset, Literal, RDF, URIRef

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import didactic_review as review


class DidacticReviewTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.dataset = Dataset()
        self.dataset.graph(URIRef("https://example.org/content")).add(
            (URIRef("https://example.org/topic"), RDF.value, Literal("Original"))
        )

    def test_content_and_rendering_changes_invalidate_but_evidence_does_not(self):
        css = self.root / "apps/pitch/src/theme.css"
        css.parent.mkdir(parents=True)
        css.write_text("color: blue")
        first = review.source_stamp(self.dataset, self.root)
        evidence = self.root / ".local/reviews.trig"
        evidence.parent.mkdir()
        evidence.write_text("review evidence")
        self.assertEqual(first, review.source_stamp(self.dataset, self.root))
        css.write_text("color: red")
        second = review.source_stamp(self.dataset, self.root)
        self.assertNotEqual(first, second)
        self.dataset.graph(URIRef("https://example.org/content")).add(
            (URIRef("https://example.org/topic"), RDF.value, Literal("Changed"))
        )
        self.assertNotEqual(second, review.source_stamp(self.dataset, self.root))

    def packet(self):
        blind = self.root / "blind"
        blind.mkdir()
        (blind / "frame.png").write_bytes(b"image evidence")
        (blind / "capture.json").write_text(json.dumps({
            "screens": [{"scene": "ex:scene--scene", "stage": 0, "image": "frame.png"}]
        }))
        (self.root / "packet.json").write_text(json.dumps({
            "sequence": "https://example.org/sequence", "sourceStamp": "current",
            "scenes": ["ex:scene--scene"],
        }))
        return SimpleNamespace(packet=self.root)

    def assessment(self, dimension="accuracy", assessment="reviewed", **changes):
        fields = dict(packet=self.root, dimension=dimension, assessment=assessment,
                      reviewer="Test reviewer", reconstruction="Observed evidence supports the result.",
                      scene=None, stage=None, finding=None, recommendation=None)
        fields.update(changes)
        return SimpleNamespace(**fields)

    @patch.object(review, "assemble_dataset")
    @patch.object(review, "source_stamp", return_value="current")
    def test_missing_dimensions_and_recaptured_evidence_require_review(self, *_mocks):
        args = self.packet()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(review.check(args), 1)
            for dimension in review.DIMENSIONS:
                review.record(self.assessment(dimension))
            self.assertEqual(review.check(args), 0)
            (self.root / "blind/frame.png").write_bytes(b"changed image")
            self.assertEqual(review.check(args), 1)

    @patch.object(review, "assemble_dataset")
    @patch.object(review, "source_stamp", return_value="current")
    def test_findings_require_captured_location_and_correction(self, *_mocks):
        self.packet()
        with self.assertRaisesRegex(ValueError, "requires scene"):
            review.record(self.assessment(assessment="needs-revision"))
        with self.assertRaisesRegex(ValueError, "was not captured"):
            review.record(self.assessment(scene="ex:scene--scene", stage=3))
        with contextlib.redirect_stdout(io.StringIO()):
            review.record(self.assessment(assessment="needs-revision", scene="ex:scene--scene",
                                         stage=0, finding="Missing premise", recommendation="Show the premise"))
            self.assertEqual(review.check(SimpleNamespace(packet=self.root)), 1)

    @patch.object(review, "assemble_dataset")
    @patch.object(review, "source_stamp", return_value="changed")
    def test_stale_packet_rejects_new_review(self, *_mocks):
        args = self.packet()
        with self.assertRaisesRegex(ValueError, "stale"):
            review.record(self.assessment())
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(review.check(args), 1)

    @patch.object(review, "assemble_dataset")
    @patch.object(review, "source_stamp", return_value="current")
    def test_batch_assessments_share_verified_evidence_and_keep_findings(self, stamp, _dataset):
        args = self.packet()
        submitted = Dataset()
        graph = submitted.graph(review.REVIEW_GRAPH)
        for dimension in review.DIMENSIONS:
            subject = URIRef("https://example.org/review/" + dimension)
            graph.add((subject, RDF.type, review.CD.DidacticReview))
            for predicate, value in (
                (review.CD.reviewDimension, dimension), (review.CD.reviewAssessment, "reviewed"),
                (review.CD.reviewReviewer, "Independent test reviewer"),
                (review.CD.reviewReconstruction, "Evidence and inference reconstructed."),
            ):
                graph.add((subject, predicate, Literal(value)))
        report = self.root / "submission.trig"
        submitted.serialize(report, format="trig")
        with contextlib.redirect_stdout(io.StringIO()):
            review.record_batch(SimpleNamespace(packet=self.root, report=report))
            self.assertEqual(stamp.call_count, 1)
            self.assertEqual(review.check(args), 0)


if __name__ == "__main__":
    unittest.main()
