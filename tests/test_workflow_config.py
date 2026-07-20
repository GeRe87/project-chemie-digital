"""Contract tests for the scheduled workflow configuration."""

from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / ".agents" / "workflow-config.json"
CORE_REF = "e04fddc8cf6de6e03da6305a475ff0a04ae29521"
CONTEXT = "agent-validator/project-chemie-digital"
MARKER = "<!-- agent-workflow-validator:project-chemie-digital -->"


class WorkflowConfigContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = json.loads(CONFIG.read_text(encoding="utf-8"))

    def test_core_is_immutably_pinned(self) -> None:
        core = self.config["core"]
        self.assertEqual(core["repository"], "GeRe87/agent-workflow-core")
        self.assertEqual(core["ref"], CORE_REF)
        self.assertEqual(len(core["ref"]), 40)
        self.assertNotIn(core["ref"], {"main", "master", "HEAD"})
        self.assertIn("governance/ci-diagnostics.md", core["governance"])
        self.assertEqual(len(core["governance"]), len(set(core["governance"])))

    def test_external_exact_head_provider_is_closed(self) -> None:
        validation = self.config["validation"]
        self.assertEqual(
            set(validation),
            {"provider", "requiredContexts", "requireExactHead", "evidence"},
        )
        self.assertEqual(validation["provider"], "external-commit-status")
        self.assertEqual(validation["requiredContexts"], [CONTEXT])
        self.assertTrue(validation["requireExactHead"])
        self.assertEqual(
            validation["evidence"],
            {"type": "pull-request-comment", "marker": MARKER},
        )

    def test_merge_policy_remains_manager_only(self) -> None:
        self.assertEqual(
            self.config["merge_policy"],
            {
                "agent_merge_enabled": True,
                "base_branch": "main",
                "manager_only": True,
                "require_successful_checks": True,
                "require_accepted_review": True,
                "merge_method": "squash",
            },
        )


if __name__ == "__main__":
    unittest.main()
