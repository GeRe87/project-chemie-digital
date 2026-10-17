"""Product-owned contract for the CDAC-native v2 control boundary."""
from __future__ import annotations

import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MARKER = ROOT / ".cdac" / "project.json"


class NativeAgentControlContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MARKER.read_text(encoding="utf-8"))
        cls.package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

    def test_canonical_native_manifest(self):
        self.assertEqual(self.manifest, {
            "schema": "chemie-digital.product-control.v2",
            "control": "cdac",
            "repository": "GeRe87/project-chemie-digital",
            "semantic_source": "ontology/dataset",
            "validation": {"local_command": ["npm", "test"], "semantic": "SHACL"},
        })
        self.assertTrue((ROOT / "ontology" / "dataset").is_dir())

    def test_validator_and_semantic_validation_remain(self):
        scripts = self.package["scripts"]
        self.assertIn("check:semantics", scripts)
        self.assertIn("test:semantics", scripts)
        self.assertIn("test", scripts)
        self.assertIn("test:semantics", scripts["test"])
        self.assertIn("check:semantics", scripts)
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        self.assertIn("agent-validator/project-chemie-digital", agents)
        self.assertIn("npm test", agents)
        self.assertIn("SHACL", agents)
        self.assertIn("no automatic merge", agents.lower())

    def test_single_control_interface(self):
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        self.assertIn("chemie-digital-agent-control-", agents)
        self.assertIn(".cdac/project.json", agents)
        self.assertFalse((ROOT / ".agents/workflows/index.json").exists())
        self.assertFalse((ROOT / ".agents/dispatcher-protocol.md").exists())


if __name__ == "__main__":
    unittest.main()
