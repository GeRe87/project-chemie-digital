from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("fuseki_local", ROOT / "scripts" / "fuseki_local.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


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


if __name__ == "__main__":
    unittest.main()
