from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

from rdflib import Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("fuseki_local", ROOT / "scripts" / "fuseki_local.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

STANDARD_DEVIATION_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation"
)
R_CODE_EXAMPLE = URIRef("https://w3id.org/project-chemie-digital/resource/sd-r-code-example")
CODE_PREDICATE = URIRef("https://w3id.org/project-chemie-digital/ontology/code")
EXPECTED_R_CODE = Literal("x <- c(6, 8, 10)\nsd(x)")


def populated_graph_names(dataset: Dataset) -> set[str]:
    return {
        str(graph)
        for _subject, _predicate, _obj, graph in dataset.quads((None, None, None, None))
    }


class FusekiLocalFoundationTests(unittest.TestCase):
    def test_pinned_release_and_server_command_are_local_read_only(self) -> None:
        self.assertEqual("6.2.0", MODULE.FUSEKI_VERSION)
        self.assertEqual(128, len(MODULE.FUSEKI_ARCHIVE_SHA512))
        command = MODULE.build_server_command(
            server_jar=Path("C:/fuseki/fuseki-server.jar"),
            snapshot_path=Path("C:/repo/.local/fuseki/canonical-dataset.nq"),
        )
        self.assertIn(MODULE.FUSEKI_MAIN_CLASS, command)
        self.assertIn("--localhost", command)
        self.assertIn("--port=3030", command)
        self.assertIn("/chemie-digital", command)
        self.assertNotIn("--update", command)
        self.assertTrue(any(item.startswith("--file=") for item in command))

    def test_snapshot_uses_canonical_dataset_and_preserves_named_graphs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "canonical-dataset.nq"
            fingerprint = MODULE.write_snapshot(output)
            text = output.read_text(encoding="utf-8")
            self.assertEqual(64, len(fingerprint))
            self.assertIn(
                "<https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation>",
                text,
            )
            self.assertIn(
                "<https://w3id.org/project-chemie-digital/graph/paths/standard-deviation>",
                text,
            )
            self.assertIn(
                "<https://w3id.org/project-chemie-digital/resource/standard-deviation>",
                text,
            )

    def test_snapshot_is_valid_nquads_and_roundtrips_multiline_r_code(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "canonical-dataset.nq"
            MODULE.write_snapshot(output)
            text = output.read_text(encoding="utf-8")

            self.assertNotIn('"""x <- c(6, 8, 10)', text)
            self.assertIn('"x <- c(6, 8, 10)\\nsd(x)"', text)

            parsed = Dataset(default_union=False)
            parsed.parse(output, format="nquads")
            original = MODULE.assemble_dataset()

            self.assertEqual(
                len(list(original.quads((None, None, None, None)))),
                len(list(parsed.quads((None, None, None, None)))),
            )
            self.assertEqual(populated_graph_names(original), populated_graph_names(parsed))
            self.assertIn(
                (R_CODE_EXAMPLE, CODE_PREDICATE, EXPECTED_R_CODE, STANDARD_DEVIATION_GRAPH),
                set(parsed.quads((R_CODE_EXAMPLE, CODE_PREDICATE, None, STANDARD_DEVIATION_GRAPH))),
            )


if __name__ == "__main__":
    unittest.main()
