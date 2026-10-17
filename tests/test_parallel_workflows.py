"""Regression guards: retired legacy dispatcher must not become operative."""
from __future__ import annotations

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
LEGACY = (
    ".agents/dispatcher-protocol.md",
    ".agents/workflow-config.json",
    ".agents/state.json",
    ".agents/state.schema.json",
    ".agents/workflows/index.json",
    ".agents/workflows/system/workflow-config.json",
    ".agents/workflows/system/state.json",
    ".agents/workflows/chemometrics/workflow-config.json",
    ".agents/workflows/chemometrics/state.json",
)


class CdacOnlyGovernanceTests(unittest.TestCase):
    def test_no_executable_core_state_remains(self):
        for name in LEGACY:
            with self.subTest(path=name):
                self.assertFalse((ROOT / name).exists(), name)
        self.assertEqual(
            json.loads((ROOT / ".cdac/project.json").read_text(encoding="utf-8"))["control"],
            "cdac",
        )

    def test_historical_audit_remains_recoverable(self):
        archive = (ROOT / "docs/legacy-agent-workflow-core/README.md").read_text(
            encoding="utf-8")
        for name in LEGACY:
            with self.subTest(path=name):
                self.assertIn(name, archive)
        self.assertIn("2a398130683d23109520e21297d7e5422a7f7e39", archive)
        self.assertTrue((ROOT / ".agents/handoffs/issue-158-chemometrics-variance-dispersion-path.md").exists())

    def test_safety_and_semantic_boundary_survive_cutover(self):
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        operating = (ROOT / "docs/agent-operating-model.md").read_text(encoding="utf-8")
        for clause in ("ontology/dataset/", "SHACL", "npm test",
                       "agent-validator/project-chemie-digital"):
            with self.subTest(clause=clause):
                self.assertIn(clause, agents)
        self.assertIn("CDAC", operating)
        self.assertIn("isolated", operating)
        self.assertIn("exact current PR HEAD", operating)
        self.assertIn("no central", operating.lower())


if __name__ == "__main__":
    unittest.main()
